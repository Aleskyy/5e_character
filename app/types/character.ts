import type { Ability } from "~/types/rules";

export type { Ability };

export type AbilityScores = Record<Ability, number>;

export type Condition =
  | "blinded" | "charmed" | "deafened" | "frightened" | "grappled"
  | "incapacitated" | "invisible" | "paralyzed" | "petrified" | "poisoned"
  | "prone" | "restrained" | "stunned" | "unconscious";

export type DeathSaves = { successes: number; failures: number };

export type Relation = {
  id: string;
  name: string;
  race: string;
  status: string;
  notes: string;
};

export type InventoryEntry = {
  id: string;
  itemId: string;
  quantity: number;
  equipped?: boolean;
  containerId?: string | null;
};

export type ClassEntry = {
  classId: string;
  subclassId: string;
  level: number;
};

export type CharacterBackground = {
  name?: string;
  alignment?: string;
  experience?: number;
  personalityTraits?: string;
  ideals?: string;
  bonds?: string;
  flaws?: string;
  appearance?: string;
  backstory?: string;
};

export type CharacterDraft = {
  id: string;
  version: number;
  name: string;
  imageUrl?: string;
  level: number;
  classId: string;
  subclassId: string;
  classes: ClassEntry[];
  raceId: string;
  abilityScores: AbilityScores;
  currency: {
    cp: number;
    sp: number;
    gp: number;
    pp: number;
  };
  maxHp: number;
  currentHp: number;
  temporaryHp: number;
  selectedSpellIds: string[];

  armorClass?: number;
  initiativeBonus?: number;
  speed?: number;
  inspiration?: boolean;
  hitDiceUsed?: number;
  deathSaves?: DeathSaves;
  conditions?: Condition[];
  exhaustion?: number;
  concentration?: { active: boolean; spellName?: string };

  languages?: string[];
  toolProficiencies?: string[];
  weaponProficiencies?: string[];
  armorProficiencies?: string[];
  weaponMasteries?: string[];

  background?: CharacterBackground;
  relations?: Relation[];
  inventory?: InventoryEntry[];

  preparedSpellIds?: string[];
  featIds?: string[];
  classResourcesUsed?: Record<string, number>;

  usedSpellSlots?: number[];
  skillProficiencies?: string[];
  skillExpertise?: string[];
  savingThrowProficiencies?: Ability[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
};
