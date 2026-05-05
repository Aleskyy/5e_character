export type EncounterEntry = {
  id: string;
  kind: "pc" | "monster" | "npc";
  refId?: string;
  name: string;
  initiative?: number;
  currentHp?: number;
  maxHp?: number;
  ac?: number;
  notes?: string;
};

export type Encounter = {
  id: string;
  name: string;
  description?: string;
  entries: EncounterEntry[];
  createdAt: string;
  updatedAt: string;
};

export type CustomMonster = {
  id: string;
  name: string;
  size?: string;
  type?: string;
  ac: number;
  hp: number;
  speed?: number;
  abilityScores: { str: number; dex: number; con: number; int: number; wis: number; cha: number };
  skills?: string;
  senses?: string;
  cr?: string;
  traits?: string;
  actions?: string;
  notes?: string;
  createdAt: string;
};
