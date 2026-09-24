const BoosterBox = require("../models/boosterBox.model");

const getBoosterBoxes = async (req, res, next) => {
  try {
    res.json(await BoosterBox.find({ isActive: true }).sort({ releaseYear: -1, name: 1 }));
  } catch (error) {
    next(error);
  }
};

module.exports = { getBoosterBoxes };
