import type { AbilityScores, CharacterDraft, ClassEntry } from "~/types/character";
import type { Ability, ClassData, RulesEntity } from "~/types/rules";
import { totalLevel } from "~/utils/multiclass";

export const abilities: Ability[] = ["str", "dex", "con", "int", "wis", "cha"];

export const abilityLabels: Record<Ability, string> = {
  str: "Strength",
  dex: "Dexterity",
  con: "Constitution",
  int: "Intelligence",
  wis: "Wisdom",
  cha: "Charisma",
};

export const defaultAbilityScores = (): AbilityScores => ({
  str: 10,
  dex: 10,
  con: 10,
  int: 10,
  wis: 10,
  cha: 10,
});

export const abilityModifier = (score: number) => Math.floor((score - 10) / 2);

export const signed = (value: number) => (value >= 0 ? `+${value}` : String(value));

export const proficiencyBonus = (level: number) => Math.ceil(level / 4) + 1;

export const createEmptyCharacter = (): CharacterDraft => {
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    version: 1,
    name: "New Character",
    level: 1,
    classId: "",
    subclassId: "",
    classes: [],
    raceId: "",
    abilityScores: defaultAbilityScores(),
    currency: {
      cp: 0,
      sp: 0,
      gp: 0,
      pp: 0,
    },
    maxHp: 8,
    currentHp: 8,
    temporaryHp: 0,
    selectedSpellIds: [],
    featIds: [],
    fightingStyleIds: [],
    background: {},
    createdAt: now,
    updatedAt: now,
  };
};

export const spellSlotsForLevel = (
  characterClass: RulesEntity<ClassData> | undefined,
  level: number,
) => characterClass?.data.spellSlotProgression[level - 1] ?? [];

export const cantripsKnownForLevel = (
  characterClass: RulesEntity<ClassData> | undefined,
  level: number,
) => characterClass?.data.cantripProgression[level - 1] ?? 0;

export const normalizeCharacter = (
  input: Partial<CharacterDraft> & { gold?: number },
): CharacterDraft => {
  const merged = {
    ...createEmptyCharacter(),
    ...input,
    subclassId: input.subclassId ?? "",
    currency: input.currency ?? {
      cp: 0,
      sp: 0,
      gp: input.gold ?? 0,
      pp: 0,
    },
  };

  let classes: ClassEntry[] = Array.isArray(merged.classes) ? merged.classes : [];
  if (classes.length === 0 && merged.classId) {
    classes = [{
      classId: merged.classId,
      subclassId: merged.subclassId ?? "",
      level: merged.level ?? 1,
    }];
  }
  // Drop ghost entries (e.g. an unfilled "Add class" row) so they don't persist.
  classes = classes.filter((entry) => entry.classId);

  const level = classes.length ? totalLevel(classes) : (merged.level ?? 1);

  return {
    ...merged,
    classes,
    level,
    classId: classes[0]?.classId ?? merged.classId ?? "",
    subclassId: classes[0]?.subclassId ?? merged.subclassId ?? "",
  };
};
