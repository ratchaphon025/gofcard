require("dotenv").config();

const connectDB = require("./config/db");
const Card = require("./models/card.model");

const iconicNames = [
  "Blue-Eyes White Dragon", "Dark Magician", "Dark Magician Girl", "Red-Eyes Black Dragon",
  "Exodia the Forbidden One", "Summoned Skull", "Kuriboh", "Jinzo", "Black Luster Soldier",
  "Cyber Dragon", "Stardust Dragon", "Black Rose Dragon", "Galaxy-Eyes Photon Dragon",
  "Elemental HERO Neos", "The Winged Dragon of Ra", "Slifer the Sky Dragon", "Obelisk the Tormentor",
  "Harpie's Feather Duster", "Monster Reborn", "Mirror Force",
];

const mapCardType = (type = "") => type.includes("Spell") ? "Spell" : type.includes("Trap") ? "Trap" : "Monster";

const getCard = async (name) => {
  const response = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${encodeURIComponent(name)}`);
  if (!response.ok) throw new Error(`Unable to retrieve ${name}`);
  return (await response.json()).data?.[0];
};

const getThbPerUsd = async () => {
  const response = await fetch("https://api.frankfurter.dev/v1/latest?base=USD&symbols=THB");
  if (!response.ok) throw new Error(`Unable to retrieve the USD/THB rate (${response.status})`);
  const { rates } = await response.json();
  const rate = Number(rates?.THB);
  if (!Number.isFinite(rate) || rate <= 0) throw new Error("The USD/THB rate is invalid");
  return rate;
};

const seedIconicCards = async () => {
  await connectDB();
  const [sourceCards, thbPerUsd] = await Promise.all([
    Promise.all(iconicNames.map(getCard)),
    getThbPerUsd(),
  ]);

  for (let index = 0; index < sourceCards.length; index += 1) {
    const source = sourceCards[index];
    if (!source) throw new Error(`Missing card data for ${iconicNames[index]}`);
    const cardType = mapCardType(source.type);
    const tcgplayerPrice = Number(source.card_prices?.[0]?.tcgplayer_price);
    if (!Number.isFinite(tcgplayerPrice) || tcgplayerPrice <= 0) {
      throw new Error(`Missing TCGplayer market price for ${source.name}`);
    }
    const updates = {
      cardType,
      attribute: cardType === "Monster" ? source.attribute || null : null,
      level: cardType === "Monster" ? Number(source.level || 0) : 0,
      atk: cardType === "Monster" ? Math.max(0, Number(source.atk || 0)) : 0,
      def: cardType === "Monster" ? Math.max(0, Number(source.def || 0)) : 0,
      description: source.desc,
      effectTH: "",
      imageUrl: source.card_images?.[0]?.image_url || "",
      price: Math.round(tcgplayerPrice * thbPerUsd),
      isFeatured: true,
      isActive: true,
    };
    const existing = await Card.findOne({ name: source.name });
    if (existing) {
      await Card.findByIdAndUpdate(existing._id, updates, { runValidators: true });
    } else {
      await Card.create({ ...updates, cardCode: `ICONIC-${String(index + 1).padStart(3, "0")}`, name: source.name, rarity: "Ultra Rare", stock: 1, condition: "Near Mint" });
    }
  }
  console.log(`Updated ${sourceCards.length} iconic Yu-Gi-Oh! cards at USD/THB ${thbPerUsd}.`);
  process.exit(0);
};

seedIconicCards().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
