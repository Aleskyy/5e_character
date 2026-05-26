import type { Ability } from "~/types/rules";

export const SCALAR = {
  characterName: "CharacterName",
  classLevel: "ClassLevel",
  race: "Race ",
  background: "Background",
  alignment: "Alignment",
  xp: "XP",
  profBonus: "ProfBonus",
  ac: "AC",
  initiative: "Initiative",
  speed: "Speed",
  hpMax: "HPMax",
  hpCurrent: "HPCurrent",
  hpTemp: "HPTemp",
  hdTotal: "HDTotal",
  hd: "HD",
  passive: "Passive",
  attacksSpellcasting: "AttacksSpellcasting",
  proficienciesLang: "ProficienciesLang",
  equipment: "Equipment",
  featuresTraits: "Features and Traits",
  cp: "CP", sp: "SP", ep: "EP", gp: "GP", pp: "PP",
  // page 2
  characterName2: "CharacterName 2",
  personality: "PersonalityTraits ",
  ideals: "Ideals",
  bonds: "Bonds",
  flaws: "Flaws",
  backstory: "Backstory",
  allies: "Allies",
  featTraits2: "Feat+Traits",
  // page 3 spellcasting header
  spellClass: "Spellcasting Class 2",
  spellAbility: "SpellcastingAbility 2",
  spellSaveDc: "SpellSaveDC  2",
  spellAtkBonus: "SpellAtkBonus 2",
} as const;

export const ABILITY_SCORE_FIELD: Record<Ability, string> = {
  str: "STR", dex: "DEX", con: "CON", int: "INT", wis: "WIS", cha: "CHA",
};

export const ABILITY_MOD_FIELD: Record<Ability, string> = {
  str: "STRmod", dex: "DEXmod ", con: "CONmod", int: "INTmod", wis: "WISmod", cha: "CHamod",
};

export const SAVE_FIELD: Record<Ability, string> = {
  str: "ST Strength", dex: "ST Dexterity", con: "ST Constitution",
  int: "ST Intelligence", wis: "ST Wisdom", cha: "ST Charisma",
};

export const SAVE_CHECKBOX: Record<Ability, string> = {
  str: "Check Box 11", dex: "Check Box 18", con: "Check Box 19",
  int: "Check Box 20", wis: "Check Box 21", cha: "Check Box 22",
};

// skill key (from utils/skills.ts) -> total text field (exact trailing spaces)
export const SKILL_FIELD: Record<string, string> = {
  acrobatics: "Acrobatics", animalHandling: "Animal", arcana: "Arcana", athletics: "Athletics",
  deception: "Deception ", history: "History ", insight: "Insight", intimidation: "Intimidation",
  investigation: "Investigation ", medicine: "Medicine", nature: "Nature", perception: "Perception ",
  performance: "Performance", persuasion: "Persuasion", religion: "Religion",
  sleightOfHand: "SleightofHand", stealth: "Stealth ", survival: "Survival",
};

// skill key -> proficiency checkbox
export const SKILL_CHECKBOX: Record<string, string> = {
  acrobatics: "Check Box 23", animalHandling: "Check Box 24", arcana: "Check Box 25",
  athletics: "Check Box 26", deception: "Check Box 27", history: "Check Box 28",
  insight: "Check Box 29", intimidation: "Check Box 30", investigation: "Check Box 31",
  medicine: "Check Box 32", nature: "Check Box 33", perception: "Check Box 34",
  performance: "Check Box 35", persuasion: "Check Box 36", religion: "Check Box 37",
  sleightOfHand: "Check Box 38", stealth: "Check Box 39", survival: "Check Box 40",
};

export const WEAPON_ROWS: { name: string; atk: string; damage: string }[] = [
  { name: "Wpn Name", atk: "Wpn1 AtkBonus", damage: "Wpn1 Damage" },
  { name: "Wpn Name 2", atk: "Wpn2 AtkBonus ", damage: "Wpn2 Damage " },
  { name: "Wpn Name 3", atk: "Wpn3 AtkBonus  ", damage: "Wpn3 Damage " },
];

export const SLOT_FIELDS_BY_LEVEL: Record<number, { total: string; remaining: string }> = {
  1: { total: "SlotsTotal 19", remaining: "SlotsRemaining 19" },
  2: { total: "SlotsTotal 20", remaining: "SlotsRemaining 20" },
  3: { total: "SlotsTotal 21", remaining: "SlotsRemaining 21" },
  4: { total: "SlotsTotal 22", remaining: "SlotsRemaining 22" },
  5: { total: "SlotsTotal 23", remaining: "SlotsRemaining 23" },
  6: { total: "SlotsTotal 24", remaining: "SlotsRemaining 24" },
  7: { total: "SlotsTotal 25", remaining: "SlotsRemaining 25" },
  8: { total: "SlotsTotal 26", remaining: "SlotsRemaining 26" },
  9: { total: "SlotsTotal 27", remaining: "SlotsRemaining 27" },
};

// spell level (0 = cantrips) -> ordered spell-name row fields
export const SPELL_ROWS_BY_LEVEL: Record<number, string[]> = {
  0: ["Spells 1014", "Spells 1016", "Spells 1017", "Spells 1018", "Spells 1019", "Spells 1020", "Spells 1021", "Spells 1022"],
  1: ["Spells 1015", "Spells 1023", "Spells 1024", "Spells 1025", "Spells 1026", "Spells 1027", "Spells 1028", "Spells 1029", "Spells 1030", "Spells 1031", "Spells 1032", "Spells 1033"],
  2: ["Spells 1046", "Spells 1034", "Spells 1035", "Spells 1036", "Spells 1037", "Spells 1038", "Spells 1039", "Spells 1040", "Spells 1041", "Spells 1042", "Spells 1043", "Spells 1044", "Spells 1045"],
  3: ["Spells 1048", "Spells 1047", "Spells 1049", "Spells 1050", "Spells 1051", "Spells 1052", "Spells 1053", "Spells 1054", "Spells 1055", "Spells 1056", "Spells 1057", "Spells 1058", "Spells 1059"],
  4: ["Spells 1061", "Spells 1060", "Spells 1062", "Spells 1063", "Spells 1064", "Spells 1065", "Spells 1066", "Spells 1067", "Spells 1068", "Spells 1069", "Spells 1070", "Spells 1071", "Spells 1072"],
  5: ["Spells 1074", "Spells 1073", "Spells 1075", "Spells 1076", "Spells 1077", "Spells 1078", "Spells 1079", "Spells 1080", "Spells 1081"],
  6: ["Spells 1083", "Spells 1082", "Spells 1084", "Spells 1085", "Spells 1086", "Spells 1087", "Spells 1088", "Spells 1089", "Spells 1090"],
  7: ["Spells 1092", "Spells 1091", "Spells 1093", "Spells 1094", "Spells 1095", "Spells 1096", "Spells 1097", "Spells 1098", "Spells 1099"],
  8: ["Spells 10101", "Spells 10100", "Spells 10102", "Spells 10103", "Spells 10104", "Spells 10105", "Spells 10106"],
  9: ["Spells 10108", "Spells 10107", "Spells 10109", "Spells 101010", "Spells 101011", "Spells 101012", "Spells 101013"],
};
