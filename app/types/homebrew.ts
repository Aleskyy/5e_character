import type { Ability } from "~/types/rules";

export type HomebrewKind = "spell" | "race" | "subrace" | "class" | "npc";

export type HBComponents = { v?: boolean; s?: boolean; m?: string | boolean };

export type HBSpell = {
  id: string;
  kind: "spell";
  name: string;
  level: number;
  school?: string;
  range?: string;
  components: HBComponents;
  diceCount?: number;
  diceFaces?: number;
  description: string;
  createdAt: string;
};

export type HBRaceFeature = { name: string; description: string };

export type HBRace = {
  id: string;
  kind: "race";
  name: string;
  size?: string;
  speed?: number;
  abilityBonuses?: Partial<Record<Ability, number>>;
  languages?: string[];
  darkvision?: number;
  age?: string;
  alignment?: string;
  features?: HBRaceFeature[];
  traits: string;
  createdAt: string;
};

export type HBSubrace = {
  id: string;
  kind: "subrace";
  name: string;
  parentRaceId: string;
  abilityBonuses?: Partial<Record<Ability, number>>;
  languages?: string[];
  darkvision?: number;
  speed?: number;
  features?: HBRaceFeature[];
  traits: string;
  createdAt: string;
};

export type HBClassFeature = { level: number; name: string; description: string };

export type HBClass = {
  id: string;
  kind: "class";
  name: string;
  hitDieFaces: number;
  savingThrowProficiencies: Ability[];
  spellcastingAbility?: Ability | null;
  casterProgression?: "full" | "1/2" | "1/3" | "pact" | "artificer" | null;
  preparedSpellsFormula?: string | null;
  cantripProgression?: number[];
  spellSlotProgression?: number[][];
  asiLevels?: number[];
  features: HBClassFeature[];
  createdAt: string;
};

export type HBNpc = {
  id: string;
  kind: "npc";
  name: string;
  race?: string;
  description?: string;
  createdAt: string;
};

export type HomebrewEntry = HBSpell | HBRace | HBSubrace | HBClass | HBNpc;
