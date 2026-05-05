import type { Ability } from "~/types/rules";

export type Skill = {
  key: string;
  name: string;
  ability: Ability;
};

export const SKILLS: Skill[] = [
  { key: "acrobatics", name: "Acrobatics", ability: "dex" },
  { key: "animalHandling", name: "Animal Handling", ability: "wis" },
  { key: "arcana", name: "Arcana", ability: "int" },
  { key: "athletics", name: "Athletics", ability: "str" },
  { key: "deception", name: "Deception", ability: "cha" },
  { key: "history", name: "History", ability: "int" },
  { key: "insight", name: "Insight", ability: "wis" },
  { key: "intimidation", name: "Intimidation", ability: "cha" },
  { key: "investigation", name: "Investigation", ability: "int" },
  { key: "medicine", name: "Medicine", ability: "wis" },
  { key: "nature", name: "Nature", ability: "int" },
  { key: "perception", name: "Perception", ability: "wis" },
  { key: "performance", name: "Performance", ability: "cha" },
  { key: "persuasion", name: "Persuasion", ability: "cha" },
  { key: "religion", name: "Religion", ability: "int" },
  { key: "sleightOfHand", name: "Sleight of Hand", ability: "dex" },
  { key: "stealth", name: "Stealth", ability: "dex" },
  { key: "survival", name: "Survival", ability: "wis" },
];

export const SKILL_NAME_TO_KEY: Record<string, string> = SKILLS.reduce(
  (acc, skill) => {
    acc[skill.name.toLowerCase()] = skill.key;
    acc[skill.key.toLowerCase()] = skill.key;
    return acc;
  },
  {} as Record<string, string>,
);
