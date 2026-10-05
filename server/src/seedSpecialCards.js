require("dotenv").config();

const connectDB = require("./config/db");
const BoosterBox = require("./models/boosterBox.model");
const Card = require("./models/card.model");
const catalogueCards = require("./data/cards.seed");
const { getMatchingBoxPrints, getMonsterType } = require("./utils/specialCard.utils");

const CARD_API_URL = "https://db.ygoprodeck.com/api/v7/cardinfo.php?misc=yes";
const CARD_COUNT_PER_TYPE = 50;
const summonTypes = ["Fusion", "Xyz", "Synchro", "Pendulum"];

const getThbPerUsd = async () => {
  const response = await fetch("https://api.frankfurter.dev/v1/latest?base=USD&symbols=THB");
  if (!response.ok) throw new Error(`Unable to retrieve the USD/THB rate (${response.status})`);
  const { rates } = await response.json();
  const rate = Number(rates?.THB);
  if (!Number.isFinite(rate) || rate <= 0) throw new Error("The USD/THB rate is invalid");
  return rate;
};

const getRarity = (rarity = "") => {
  const value = rarity.toLowerCase();
  if (value.includes("secret") || value.includes("starlight") || value.includes("quarter century")) return "Secret Rare";
  if (value.includes("ultra")) return "Ultra Rare";
  if (value.includes("super")) return "Super Rare";
  if (value === "rare") return "Rare";
  return "Normal";
};

const seedSpecialCards = async () => {
  await connectDB();
  const [cardResponse, thbPerUsd, boxes] = await Promise.all([
    fetch(CARD_API_URL),
    getThbPerUsd(),
    BoosterBox.find({ isActive: true }, "boxCode"),
  ]);
  if (!cardResponse.ok) throw new Error(`Unable to retrieve card data (${cardResponse.status})`);

  const { data: sourceCards } = await cardResponse.json();
  if (!Array.isArray(sourceCards)) throw new Error("Card data source did not return a card list");
  const existingCards = await Card.find({}, "name isBoxPullOnly");
  const occupiedNames = new Set([
    ...catalogueCards.map((card) => card.name.toLowerCase()),
    ...existingCards.filter((card) => !card.isBoxPullOnly).map((card) => card.name.toLowerCase()),
  ]);
  const boxCodes = boxes.map((box) => box.boxCode);
  const chosenNames = new Set();
  const cardsToSeed = [];

  for (const monsterType of summonTypes) {
    const candidates = sourceCards
      .filter((card) => getMonsterType(card.type) === monsterType && !occupiedNames.has(card.name.toLowerCase()))
      .map((card) => {
        const cardMarketPrice = Number(card.card_prices?.[0]?.tcgplayer_price);
        const boxPrints = getMatchingBoxPrints(card.card_sets, boxCodes, cardMarketPrice);
        return { card, boxPrints };
      })
      .filter(({ card, boxPrints }) => card.card_images?.[0]?.image_url && boxPrints.length)
      .sort((left, right) => left.card.name.localeCompare(right.card.name));

    for (const { card, boxPrints } of candidates) {
      if (chosenNames.has(card.name.toLowerCase())) continue;
      const print = boxPrints[0];
      const seedCard = {
        cardCode: print.set_code,
        name: card.name,
        cardType: "Monster",
        monsterType,
        rarity: getRarity(print.set_rarity),
        attribute: card.attribute || null,
        level: Number(card.level || 0),
        atk: Math.max(0, Number(card.atk || 0)),
        def: Math.max(0, Number(card.def || 0)),
        description: card.desc || "",
        effectTH: "",
        imageUrl: card.card_images[0].image_url,
        priceSource: print.hasSetPrice ? "set" : "card_market",
        isBoxPullOnly: true,
        boosterBoxCodes: [...new Set(boxPrints.map(({ boxCode }) => boxCode))],
        price: Math.round(print.usdPrice * thbPerUsd),
        stock: 0,
        condition: "Near Mint",
        isActive: true,
      };
      cardsToSeed.push(seedCard);
      chosenNames.add(card.name.toLowerCase());
      if (cardsToSeed.filter((entry) => entry.monsterType === monsterType).length === CARD_COUNT_PER_TYPE) break;
    }

    const count = cardsToSeed.filter((entry) => entry.monsterType === monsterType).length;
    if (count !== CARD_COUNT_PER_TYPE) {
      throw new Error(`Expected ${CARD_COUNT_PER_TYPE} ${monsterType} cards with prints in active Booster Boxes, found ${count}`);
    }
  }

  await Card.bulkWrite(cardsToSeed.map((card) => ({
    updateOne: {
      filter: { $or: [{ cardCode: card.cardCode }, { name: card.name }] },
      update: { $set: card },
      upsert: true,
    },
  })));

  console.log(`Seeded ${cardsToSeed.length} box-pull-only cards (50 per summon type) at USD/THB ${thbPerUsd}.`);
  process.exit(0);
};

seedSpecialCards().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
