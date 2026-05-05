import type { Condition } from "~/types/character";

export const CONDITIONS: Condition[] = [
  "blinded", "charmed", "deafened", "frightened", "grappled",
  "incapacitated", "invisible", "paralyzed", "petrified", "poisoned",
  "prone", "restrained", "stunned", "unconscious",
];

export const ALIGNMENTS = [
  "Lawful Good", "Neutral Good", "Chaotic Good",
  "Lawful Neutral", "True Neutral", "Chaotic Neutral",
  "Lawful Evil", "Neutral Evil", "Chaotic Evil",
  "Unaligned",
];

export const WEAPON_CATEGORIES = [
  "Simple Melee", "Simple Ranged", "Martial Melee", "Martial Ranged",
];

export const ARMOR_CATEGORIES = [
  "Light Armor", "Medium Armor", "Heavy Armor", "Shields",
];

export const TOOLS = [
  "Alchemist's supplies", "Brewer's supplies", "Calligrapher's supplies",
  "Carpenter's tools", "Cartographer's tools", "Cobbler's tools",
  "Cook's utensils", "Glassblower's tools", "Jeweler's tools",
  "Leatherworker's tools", "Mason's tools", "Painter's supplies",
  "Potter's tools", "Smith's tools", "Tinker's tools",
  "Weaver's tools", "Woodcarver's tools",
  "Disguise kit", "Forgery kit", "Herbalism kit",
  "Navigator's tools", "Poisoner's kit", "Thieves' tools",
  "Bagpipes", "Drum", "Dulcimer", "Flute", "Lute", "Lyre",
  "Horn", "Pan flute", "Shawm", "Viol",
  "Dice set", "Dragonchess set", "Playing card set", "Three-dragon ante set",
  "Land vehicles", "Water vehicles",
];

export const RELATION_STATUSES = [
  "Known", "Friend", "Ally", "Family", "Romantic",
  "Rival", "Enemy", "Nemesis", "Patron", "Hireling", "Unknown",
];

export const COMMON_LANGUAGES = [
  "Common", "Dwarvish", "Elvish", "Giant", "Gnomish", "Goblin",
  "Halfling", "Orc", "Abyssal", "Celestial", "Draconic", "Deep Speech",
  "Infernal", "Primordial", "Sylvan", "Undercommon", "Thieves' Cant", "Druidic",
];
