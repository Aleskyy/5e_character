export type RestType = "short" | "long" | "none";

export type ClassResource = {
  key: string;
  name: string;
  rest: RestType;
  /** returns max charges given level, or null/0 if unavailable */
  max: (level: number) => number;
  description?: string;
};

const byLevelTable = (table: Record<number, number>): ((level: number) => number) => (level) => {
  let value = 0;
  for (let i = 1; i <= level; i++) if (table[i] !== undefined) value = table[i];
  return value;
};

const RAGES = byLevelTable({ 1: 2, 3: 3, 6: 4, 12: 5, 17: 6, 20: Infinity });
const KI_POINTS = (level: number) => (level >= 2 ? level : 0);
const SORC_POINTS = (level: number) => (level >= 2 ? level : 0);
const CHANNEL_DIVINITY = (level: number) => (level >= 18 ? 3 : level >= 6 ? 2 : level >= 2 ? 1 : 0);
const WILD_SHAPE = (level: number) => (level >= 2 ? 2 : 0);
const SECOND_WIND = byLevelTable({ 1: 1, 4: 2, 10: 3, 19: 4 });
const ACTION_SURGE = (level: number) => (level >= 17 ? 2 : level >= 2 ? 1 : 0);
const INDOMITABLE = (level: number) => (level >= 17 ? 3 : level >= 13 ? 2 : level >= 9 ? 1 : 0);
const BARDIC_INSP = byLevelTable({ 1: 2, 5: 3, 13: 4 });
const LAY_ON_HANDS = (level: number) => level * 5;
const ARCANE_RECOVERY = (level: number) => Math.ceil(level / 2);
const FONT_OF_MAGIC = SORC_POINTS;
const PSI_DIE = byLevelTable({ 1: 2, 5: 3, 11: 4, 17: 5 });

export const CLASS_RESOURCES: Record<string, ClassResource[]> = {
  Barbarian: [
    { key: "rage", name: "Rage", rest: "long", max: RAGES, description: "Rages per long rest" },
  ],
  Bard: [
    { key: "bardic-inspiration", name: "Bardic Inspiration", rest: "short", max: BARDIC_INSP },
  ],
  Cleric: [
    { key: "channel-divinity", name: "Channel Divinity", rest: "short", max: CHANNEL_DIVINITY },
  ],
  Druid: [
    { key: "wild-shape", name: "Wild Shape", rest: "short", max: WILD_SHAPE },
  ],
  Fighter: [
    { key: "second-wind", name: "Second Wind", rest: "short", max: SECOND_WIND },
    { key: "action-surge", name: "Action Surge", rest: "short", max: ACTION_SURGE },
    { key: "indomitable", name: "Indomitable", rest: "long", max: INDOMITABLE },
  ],
  Monk: [
    { key: "ki", name: "Ki / Discipline Points", rest: "short", max: KI_POINTS },
  ],
  Paladin: [
    { key: "lay-on-hands", name: "Lay on Hands (HP pool)", rest: "long", max: LAY_ON_HANDS },
    { key: "channel-divinity", name: "Channel Divinity", rest: "short", max: (l) => (l >= 3 ? 1 : 0) },
  ],
  Ranger: [],
  Rogue: [],
  Sorcerer: [
    { key: "sorcery-points", name: "Sorcery Points", rest: "long", max: FONT_OF_MAGIC },
  ],
  Warlock: [],
  Wizard: [
    { key: "arcane-recovery", name: "Arcane Recovery", rest: "long", max: ARCANE_RECOVERY, description: "Recover spell slots equal to half your wizard level (rounded up)" },
  ],
  Artificer: [
    { key: "infusions", name: "Infusions Known", rest: "none", max: byLevelTable({ 2: 4, 6: 6, 10: 8, 14: 10, 18: 12 }) },
  ],
};

export const RESOURCE_DESCRIPTIONS_LATE = (className: string, level: number): { key: string; name: string; description: string }[] => {
  const out: { key: string; name: string; description: string }[] = [];
  if (className === "Sorcerer" && level >= 1) out.push({ key: "psi", name: "Psionic Power", description: "If subclass uses Psi dice (Aberrant, Psi Warrior, Soulknife)." });
  return out;
};
