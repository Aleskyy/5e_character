import type { AbilityScores, CharacterDraft } from "~/types/character";
import type { Ability, ClassData, RulesEntity } from "~/types/rules";

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
