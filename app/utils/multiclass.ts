import type { ClassEntry } from "~/types/character";
import type { ClassData, RulesEntity } from "~/types/rules";

export type ClassLookup = (classId: string) => RulesEntity<ClassData> | undefined;

/** Progressions that contribute slots via the shared multiclass table. */
const SLOT_PROGRESSIONS = new Set(["full", "1/2", "1/3", "artificer"]);

export const totalLevel = (classes: ClassEntry[]): number =>
  classes.reduce((sum, c) => sum + (c.level || 0), 0);

const casterContribution = (progression: string | null, level: number): number => {
  switch (progression) {
    case "full": return level;
    case "1/2": return Math.floor(level / 2);
    case "artificer": return Math.ceil(level / 2);
    case "1/3": return Math.floor(level / 3);
    default: return 0; // null or "pact" (warlock handled separately)
  }
};

export const casterLevel = (classes: ClassEntry[], lookup: ClassLookup): number =>
  classes.reduce((sum, c) => {
    const prog = lookup(c.classId)?.data.casterProgression ?? null;
    return sum + casterContribution(prog, c.level || 0);
  }, 0);

/** Standard multiclass spellcaster slot table. Index 0 = caster level 1. */
export const MULTICLASS_SLOT_TABLE: number[][] = [
  [2],
  [3],
  [4, 2],
  [4, 3],
  [4, 3, 2],
  [4, 3, 3],
  [4, 3, 3, 1],
  [4, 3, 3, 2],
  [4, 3, 3, 3, 1],
  [4, 3, 3, 3, 2],
  [4, 3, 3, 3, 2, 1],
  [4, 3, 3, 3, 2, 1],
  [4, 3, 3, 3, 2, 1, 1],
  [4, 3, 3, 3, 2, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1, 1],
  [4, 3, 3, 3, 3, 1, 1, 1, 1],
  [4, 3, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 3, 2, 2, 1, 1],
];

export const multiclassSpellSlots = (casterLvl: number): number[] => {
  if (casterLvl < 1) return [];
  const row = MULTICLASS_SLOT_TABLE[Math.min(casterLvl, 20) - 1] ?? [];
  const slots = [...row];
  while (slots.length < 9) slots.push(0);
  return slots;
};

/** Classes that contribute to the shared slot table (excludes pact + non-casters). */
export const spellcastingClasses = (classes: ClassEntry[], lookup: ClassLookup): ClassEntry[] =>
  classes.filter((c) => {
    const prog = lookup(c.classId)?.data.casterProgression ?? null;
    return prog !== null && SLOT_PROGRESSIONS.has(prog);
  });

export const effectiveSpellSlots = (classes: ClassEntry[], lookup: ClassLookup): number[] => {
  const casters = spellcastingClasses(classes, lookup);
  if (casters.length === 0) return [];
  if (casters.length === 1) {
    const only = casters[0]!;
    const prog = lookup(only.classId)?.data.spellSlotProgression ?? [];
    return prog[(only.level || 1) - 1] ?? [];
  }
  return multiclassSpellSlots(casterLevel(classes, lookup));
};

/** Warlock pact magic: [count, slotLevel] indexed by warlock level - 1. */
export const PACT_MAGIC: { count: number; level: number }[] = [
  { count: 1, level: 1 }, { count: 2, level: 1 }, { count: 2, level: 2 }, { count: 2, level: 2 },
  { count: 2, level: 3 }, { count: 2, level: 3 }, { count: 2, level: 4 }, { count: 2, level: 4 },
  { count: 2, level: 5 }, { count: 2, level: 5 }, { count: 3, level: 5 }, { count: 3, level: 5 },
  { count: 3, level: 5 }, { count: 3, level: 5 }, { count: 3, level: 5 }, { count: 3, level: 5 },
  { count: 4, level: 5 }, { count: 4, level: 5 }, { count: 4, level: 5 }, { count: 4, level: 5 },
];

export const pactSlots = (
  classes: ClassEntry[],
  lookup: ClassLookup,
): { count: number; level: number } | null => {
  const warlock = classes.find((c) => (lookup(c.classId)?.data.casterProgression ?? null) === "pact");
  if (!warlock) return null;
  const lvl = Math.min(20, Math.max(1, warlock.level || 1));
  return PACT_MAGIC[lvl - 1] ?? null;
};

/** Compact label like "2d8 · 3d10" grouping hit dice by die size. */
export const hitDiceLabel = (classes: ClassEntry[], lookup: ClassLookup): string => {
  const byFaces = new Map<number, number>();
  for (const c of classes) {
    const faces = lookup(c.classId)?.data.hitDie?.faces ?? 8;
    byFaces.set(faces, (byFaces.get(faces) ?? 0) + (c.level || 0));
  }
  return [...byFaces.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([faces, count]) => `${count}d${faces}`)
    .join(" · ");
};
