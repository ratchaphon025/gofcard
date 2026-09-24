require("dotenv").config();
const connectDB = require("./config/db");
const BoosterBox = require("./models/boosterBox.model");
const boxes = require("./data/boosterBoxes.seed");

const getBoxImage = async (boxCode) => {
  const prefix = boxCode.replace(/-BOX$/, "");
  const response = await fetch(`https://yugipedia.com/api.php?action=query&list=allimages&aiprefix=${encodeURIComponent(prefix)}&ailimit=50&format=json`);
  if (!response.ok) return "";
  const images = (await response.json()).query?.allimages || [];
  const preferred = images.find((image) => new RegExp(`^${prefix}-BoosterBox(?:EN|NA)?\\.(png|jpe?g)$`, "i").test(image.name))
    || images.find((image) => new RegExp(`^${prefix}-Booster(?:EN|NA)?\\.(png|jpe?g)$`, "i").test(image.name));
  return preferred?.url || "";
};

const run = async () => {
  await connectDB();
  const boxesWithImages = await Promise.all(boxes.map(async (box) => ({ ...box, imageUrl: await getBoxImage(box.boxCode) })));
  await BoosterBox.bulkWrite(boxesWithImages.map((box) => ({ updateOne: { filter: { boxCode: box.boxCode }, update: { $set: box }, upsert: true } })));
  console.log(`Seeded ${boxes.length} Yu-Gi-Oh! booster boxes.`);
  process.exit(0);
};
run().catch((error) => { console.error(error.message); process.exit(1); });
