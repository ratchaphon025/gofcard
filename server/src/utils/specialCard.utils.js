const summonTypes = [
  ["Fusion", /\bFUSION\b/i],
  ["Xyz", /\bXYZ\b/i],
  ["Synchro", /\bSYNCHRO\b/i],
  ["Pendulum", /\bPENDULUM\b/i],
];

const getMonsterType = (sourceType = "") =>
  summonTypes.find(([, pattern]) => pattern.test(sourceType))?.[0] || null;

const getMatchingBoxPrints = (cardSets = [], boxCodes = [], fallbackUsdPrice = 0) => {
  const availablePrefixes = new Map(
    boxCodes.map((boxCode) => [boxCode.replace(/-BOX$/i, "").toUpperCase(), boxCode])
  );

  return cardSets
    .map((print) => {
      const prefix = String(print.set_code || "").split("-")[0].toUpperCase();
      const setUsdPrice = Number(print.set_price);
      return {
        ...print,
        boxCode: availablePrefixes.get(prefix),
        usdPrice: Number.isFinite(setUsdPrice) && setUsdPrice > 0 ? setUsdPrice : Number(fallbackUsdPrice),
        hasSetPrice: Number.isFinite(setUsdPrice) && setUsdPrice > 0,
      };
    })
    .filter((print) => print.boxCode && Number.isFinite(print.usdPrice) && print.usdPrice > 0)
    .sort((left, right) => Number(right.hasSetPrice) - Number(left.hasSetPrice) || right.usdPrice - left.usdPrice);
};

module.exports = { getMonsterType, getMatchingBoxPrints };
