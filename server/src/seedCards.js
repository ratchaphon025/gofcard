require("dotenv").config();
const connectDB = require("./config/db");
const Card = require("./models/card.model");
const cards = require("./data/cards.seed");

const seedCards = async () => {
  await connectDB();
  await Card.bulkWrite(
    cards.map((card) => ({
      updateOne: {
        filter: { $or: [{ cardCode: card.cardCode }, { name: card.name }] },
        update: { $set: card },
        upsert: true,
      },
    }))
  );
  console.log(`Seeded ${cards.length} unique Yu-Gi-Oh! cards.`);
  process.exit(0);
};

seedCards().catch((error) => {
  console.error(error);
  process.exit(1);
});
