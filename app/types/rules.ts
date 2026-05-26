export type SourceType = "core" | "supplement" | "ua" | "homebrew";

export type RulesKind =
  | "class"
  | "subclass"
  | "classFeature"
  | "subclassFeature"
  | "race"
  | "spell"
  | "feat"
  | "fightingStyle"
  | "condition";

export type RulesEntity<TData = unknown> = {
  id: string;
  kind: RulesKind;
  name: string;
  source: string;
  sourceType: SourceType;
  data: TData;
};

export type Ability = "str" | "dex" | "con" | "int" | "wis" | "cha";

export type ClassData = {
  page: number | null;
  edition: string;
  hitDie: { number: number; faces: number } | null;
  savingThrowProficiencies: Ability[];
  spellcastingAbility: Ability | null;
  casterProgression: string | null;
  preparedSpellsFormula: string | null;
  cantripProgression: number[];
  spellsKnownProgression: number[];
  spellsKnownProgressionFixed: number[];
  spellSlotProgression: number[][];
  startingProficiencies: Record<string, unknown>;
  classFeatures: unknown[];
  multiclassing: unknown | null;
};

export type SpellAccessRef = {
  name: string;
  source: string;
  definedInSource?: string;
  className?: string;
  classSource?: string;
  subclassShortName?: string;
  subclassSource?: string;
};

export type SubclassData = {
  shortName: string;
  className: string;
  classSource: string;
  page: number | null;
  subclassFeatures: string[];
  additionalSpells: unknown[];
};

export type RaceData = {
  page: number | null;
  size: string[];
  speed: unknown;
  ability: unknown[];
  languageProficiencies: unknown[];
  skillProficiencies: unknown[];
  traitTags: string[];
  entries: unknown[];
};

export type FeatData = {
  page: number | null;
  prerequisite: unknown[];
  ability: unknown[];
  category: string | null;
  entries: unknown[];
};

export type FightingStyleData = {
  page: number | null;
  /** Class names that can take this fighting style (e.g. "Fighter", "Ranger"). */
  classes: string[];
  entries: unknown[];
};

export type SpellData = {
  page: number | null;
  level: number;
  school: string;
  time: unknown[];
  range: unknown;
  components: Record<string, unknown>;
  duration: unknown[];
  entries: unknown[];
  entriesHigherLevel: unknown[];
  damageInflict: string[];
  savingThrow: string[];
  spellAttack: string[];
  miscTags: string[];
  areaTags: string[];
  classes: SpellAccessRef[];
  classVariants: SpellAccessRef[];
  subclasses: SpellAccessRef[];
};
