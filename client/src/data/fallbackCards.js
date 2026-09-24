const names = [
  "Blue-Eyes White Dragon", "Dark Magician", "Red-Eyes Black Dragon", "Exodia the Forbidden One", "Dark Magician Girl", "Kuriboh", "Summoned Skull", "Gaia The Fierce Knight", "Celtic Guardian", "Buster Blader",
  "Jinzo", "Black Luster Soldier", "Relinquished", "Time Wizard", "Baby Dragon", "Thousand Dragon", "Flame Swordsman", "Magician of Black Chaos", "Gate Guardian", "Sanga of the Thunder",
  "Kazejin", "Suijin", "Barrel Dragon", "Cyber Dragon", "Cyber End Dragon", "Elemental HERO Neos", "Elemental HERO Flame Wingman", "Destiny HERO Plasma", "Stardust Dragon", "Red Dragon Archfiend",
  "Black Rose Dragon", "Ancient Fairy Dragon", "Power Tool Dragon", "Blackwing Armor Master", "Trishula, Dragon of the Ice Barrier", "Shooting Star Dragon", "Number 39: Utopia", "Number C39: Utopia Ray", "Galaxy-Eyes Photon Dragon", "Neo Galaxy-Eyes Photon Dragon",
  "Odd-Eyes Pendulum Dragon", "Dark Rebellion Xyz Dragon", "Clear Wing Synchro Dragon", "Starving Venom Fusion Dragon", "Decode Talker", "Firewall Dragon", "Borreload Dragon", "Accesscode Talker", "Ash Blossom & Joyous Spring", "Effect Veiler",
  "Nibiru, the Primal Being", "Droll & Lock Bird", "Ghost Ogre & Snow Rabbit", "Infinite Impermanence", "Called by the Grave", "Pot of Greed", "Monster Reborn", "Raigeki", "Harpie's Feather Duster", "Dark Hole",
  "Change of Heart", "Swords of Revealing Light", "Polymerization", "Fusion", "Miracle Fusion", "Reinforcement of the Army", "Terraforming", "Mystical Space Typhoon", "Twin Twisters", "Cosmic Cyclone",
  "Book of Moon", "Lightning Storm", "Forbidden Droplet", "Triple Tactics Talent", "Pot of Prosperity", "Mirror Force", "Magic Cylinder", "Torrential Tribute", "Solemn Judgment", "Solemn Strike",
  "Trap Hole", "Bottomless Trap Hole", "Compulsory Evacuation Device", "Skill Drain", "Royal Decree", "Call of the Haunted", "Ring of Destruction", "Imperial Order", "Anti-Spell Fragrance", "Evenly Matched",
  "Red-Eyes Flare Metal Dragon", "Blue-Eyes Alternative White Dragon", "The Winged Dragon of Ra", "Slifer the Sky Dragon", "Obelisk the Tormentor", "Egyptian God Slime", "Sky Striker Ace - Raye", "Eldlich the Golden Lord", "Kashtira Fenrir", "Tearlaments Kitkallos",
];

const rarities = ["Normal", "Rare", "Super Rare", "Ultra Rare", "Secret Rare"];
const attributes = ["LIGHT", "DARK", "EARTH", "WATER", "FIRE", "WIND"];

export const fallbackCards = names.map((name, index) => {
  const number = index + 1;
  const cardType = number > 75 ? (number % 2 ? "Spell" : "Trap") : "Monster";
  return {
    _id: `demo-${number}`,
    cardCode: `YGO-${String(number).padStart(3, "0")}`,
    name,
    cardType,
    rarity: rarities[index % rarities.length],
    attribute: cardType === "Monster" ? attributes[index % attributes.length] : null,
    level: cardType === "Monster" ? (index % 8) + 1 : 0,
    atk: cardType === "Monster" ? 500 + ((index * 250) % 3500) : 0,
    def: cardType === "Monster" ? 400 + ((index * 200) % 3000) : 0,
    price: 40 + index * 15,
    stock: index % 9 === 0 ? 1 : 3 + (index % 10),
    condition: index % 4 === 0 ? "Mint" : "Near Mint",
    effectTH: cardType === "Monster"
      ? "เมื่ออัญเชิญการ์ดนี้สำเร็จ: คุณสามารถเลือกการ์ดหงายหน้า 1 ใบในสนาม เปลี่ยนตำแหน่งการ์ดนั้นได้"
      : cardType === "Spell"
        ? "เลือกการ์ด 1 ใบในสนาม; ใช้เอฟเฟกต์นี้เพื่อสนับสนุนการเล่นของคุณ แล้วส่งการ์ดนี้ไปยังสุสาน"
        : "เมื่อคู่ต่อสู้ประกาศการโจมตี: คุณสามารถเปิดใช้งานการ์ดนี้เพื่อหยุดการโจมตีนั้น",
  };
});
