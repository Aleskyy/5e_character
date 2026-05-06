export type EncounterEntry = {
  id: string;
  kind: "pc" | "monster" | "npc";
  refId?: string;
  name: string;
  initiative?: number;
  currentHp?: number;
  maxHp?: number;
  ac?: number;
  perception?: number;
  insight?: number;
  conditions?: string[];
  exhaustion?: number;
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

export type MonsterTrait = { name: string; description: string };

export type CustomMonster = {
  id: string;
  name: string;
  size?: string;
  type?: string;
  ac: number;
  hpAvg?: number;
  hpFormula?: string;
  hp: number;
  speed?: number;
  speeds?: { walk?: number; fly?: number; swim?: number; climb?: number; burrow?: number };
  abilityScores: { str: number; dex: number; con: number; int: number; wis: number; cha: number };
  saves?: Partial<Record<"str" | "dex" | "con" | "int" | "wis" | "cha", string>>;
  skills?: string;
  skillBonuses?: Record<string, string>;
  senses?: string;
  sensesList?: string[];
  passivePerception?: number;
  languages?: string[];
  cr?: string;
  xp?: number;
  damageImmune?: string[];
  damageResist?: string[];
  damageVulnerable?: string[];
  conditionImmune?: string[];
  traits?: string;
  traitsList?: MonsterTrait[];
  actions?: string;
  actionsList?: MonsterTrait[];
  bonusActions?: MonsterTrait[];
  reactions?: MonsterTrait[];
  legendaryActions?: MonsterTrait[];
  legendaryHeader?: string;
  mythicActions?: MonsterTrait[];
  lairActions?: MonsterTrait[];
  regionalEffects?: MonsterTrait[];
  spellcasting?: string;
  source?: string;
  page?: number;
  notes?: string;
  createdAt: string;
};
