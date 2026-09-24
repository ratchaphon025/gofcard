require("dotenv").config();

const connectDB = require("./config/db");
const Card = require("./models/card.model");
const catalogueCards = require("./data/cards.seed");

const CARD_API_URL = "https://db.ygoprodeck.com/api/v7/cardinfo.php?type=Effect%20Monster&misc=yes";
const PREMIUM_CARD_COUNT = 100;

const rarityScore = (rarity) => {
  const label = rarity.toLowerCase();
  if (label.includes("starlight")) return 100;
  if (label.includes("quarter century")) return 90;
  if (label.includes("ghost")) return 80;
  if (label.includes("collector")) return 70;
  if (label.includes("ultimate")) return 65;
  if (label.includes("secret")) return 50;
  if (label.includes("ultra")) return 20;
  return 0;
};

const displayRarity = (rarity) => rarityScore(rarity) >= 50 ? "Secret Rare" : "Ultra Rare";

const selectPremiumPrint = (card) => (card.card_sets || [])
  .map((print) => ({ ...print, score: rarityScore(print.set_rarity || "") }))
  .filter((print) => print.score > 0 && Number(print.set_price) > 0)
  .sort((left, right) => Number(right.set_price) - Number(left.set_price) || right.score - left.score)[0];

// Identifies only the records created by the former fixed-price importer so they
// can be replaced instead of leaving duplicate premium listings in the store.
const selectLegacyPremiumPrint = (card) => (card.card_sets || [])
  .map((print) => ({ ...print, score: rarityScore(print.set_rarity || "") }))
  .filter((print) => print.score > 0)
  .sort((left, right) => right.score - left.score || Number(right.set_price || 0) - Number(left.set_price || 0))[0];

const toPremiumCard = ({ card, print }, thbPerUsd) => ({
  cardCode: print.set_code,
  name: card.name,
  cardType: "Monster",
  rarity: displayRarity(print.set_rarity),
  attribute: card.attribute || null,
  level: card.level || 0,
  atk: Number(card.atk || 0),
  def: Number(card.def || 0),
  // The database text is retained verbatim from the card-data source.
  description: card.desc,
  effectTH: "",
  imageUrl: card.card_images?.[0]?.image_url || "",
  // The source lists this exact set print in USD; convert it using today's USD/THB rate.
  price: Math.round(Number(print.set_price) * thbPerUsd),
  stock: 1,
  condition: "Mint",
  isActive: true,
});

const getThbPerUsd = async () => {
  const response = await fetch("https://api.frankfurter.dev/v1/latest?base=USD&symbols=THB");
  if (!response.ok) throw new Error(`Unable to retrieve the USD/THB rate (${response.status})`);
  const { rates } = await response.json();
  const rate = Number(rates?.THB);
  if (!Number.isFinite(rate) || rate <= 0) throw new Error("The USD/THB rate is invalid");
  return rate;
};

const seedPremiumCards = async () => {
  await connectDB();
  const [response, thbPerUsd] = await Promise.all([fetch(CARD_API_URL), getThbPerUsd()]);
  if (!response.ok) throw new Error(`Unable to retrieve card data (${response.status})`);

  const { data } = await response.json();
  const existingNames = new Set(catalogueCards.map((card) => card.name));
  const premiumPrints = data
    .filter((card) => !existingNames.has(card.name))
    .map((card) => ({ card, print: selectPremiumPrint(card) }))
    .filter(({ print }) => print)
    .sort((left, right) => Number(right.print.set_price) - Number(left.print.set_price) || right.print.score - left.print.score);
  const premiumCards = premiumPrints.slice(0, PREMIUM_CARD_COUNT).map((entry) => toPremiumCard(entry, thbPerUsd));
  const legacyCodes = data
    .filter((card) => !existingNames.has(card.name))
    .map((card) => ({ card, print: selectLegacyPremiumPrint(card) }))
    .filter(({ print }) => print)
    .sort((left, right) => right.print.score - left.print.score || Number(right.print.set_price || 0) - Number(left.print.set_price || 0))
    .slice(0, PREMIUM_CARD_COUNT)
    .map(({ print }) => print.set_code);

  if (premiumCards.length !== PREMIUM_CARD_COUNT) {
    throw new Error(`Expected ${PREMIUM_CARD_COUNT} premium cards, found ${premiumCards.length}`);
  }

  await Card.bulkWrite(premiumCards.map((card) => ({
    updateOne: {
      filter: { $or: [{ cardCode: card.cardCode }, { name: card.name }] },
      update: { $set: card },
      upsert: true,
    },
  })));
  const currentCodes = new Set(premiumCards.map((card) => card.cardCode));
  const staleCodes = legacyCodes.filter((code) => !currentCodes.has(code));
  if (staleCodes.length) {
    await Card.deleteMany({ cardCode: { $in: staleCodes }, condition: "Mint", stock: 1 });
  }

  console.log(`Seeded ${premiumCards.length} premium box-pull cards at USD/THB ${thbPerUsd}; removed ${staleCodes.length} fixed-price imports.`);
  process.exit(0);
};

seedPremiumCards().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
