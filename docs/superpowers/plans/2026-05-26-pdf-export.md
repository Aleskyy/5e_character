# PDF Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a one-click "Export PDF" button on the character sheet that fills the bundled official D&D 5e fillable sheet with the character's current data and downloads it.

**Architecture:** Fully client-side with `pdf-lib`. A pure `buildFieldValues(character, ctx)` computes the exact field values; an orchestrator loads the bundled PDF, writes fields with safe setters, flattens, and downloads. Field names + opaque-checkbox/spell-row maps were discovered from the real PDF and are baked into a constants module. Shared derivations are extracted into `character-stats.ts`.

**Tech Stack:** Nuxt 4 SPA (Vue 3, TS), `pdf-lib`, Vitest.

---

## Reference

Spec: `docs/superpowers/specs/2026-05-26-pdf-export-design.md`. Template: `public/template/5E_CharacterSheet_Fillable.pdf` (334 fields). Discovery script already written: `scripts/discover-pdf-fields.mjs` (re-run to re-verify maps).

### Known limitations (intentional)
- Per-spell "prepared" checkboxes on page 3 are left unchecked (opaque mapping, low value).
- Spell rows truncate at the sheet's per-level row limits.
- Warlock pact slots fold into their spell level's slot total (sheet has no separate pact track).
- Age/Height/Weight/Eyes/Skin/Hair, Treasure, FactionName left blank (not stored).
- Output is flattened (not re-editable).

---

## Task 1: Make `pdf-lib` a runtime dependency

**Files:** Modify `package.json`

- [ ] **Step 1: Move `pdf-lib` from devDependencies to dependencies**

`pdf-lib` was installed as a dev dep during design. It runs in the browser, so it must be a runtime dependency. Run:

```bash
npm install pdf-lib
```

This moves/duplicates it into `dependencies`. Then, if `pdf-lib` still appears under `devDependencies` in `package.json`, remove that line manually so it appears only under `dependencies`.

- [ ] **Step 2: Verify**

Run: `node -e "console.log(require('./package.json').dependencies['pdf-lib'] ? 'ok' : 'missing')"`
Expected: `ok`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json scripts/dump-pdf-fields.mjs scripts/discover-pdf-fields.mjs
git commit -m "chore: add pdf-lib runtime dep and PDF field discovery scripts"
```

---

## Task 2: Field-name constants (`pdf-field-names.ts`)

**Files:**
- Create: `app/utils/pdf-field-names.ts`
- Test: `test/pdf-field-names.test.ts`

- [ ] **Step 1: Create `app/utils/pdf-field-names.ts`**

These names were discovered from the bundled PDF (exact strings — note intentional trailing spaces and the lowercase `CHamod`):

```ts
import type { Ability } from "~/types/rules";

export const SCALAR = {
  characterName: "CharacterName",
  classLevel: "ClassLevel",
  race: "Race ",
  background: "Background",
  alignment: "Alignment",
  xp: "XP",
  profBonus: "ProfBonus",
  ac: "AC",
  initiative: "Initiative",
  speed: "Speed",
  hpMax: "HPMax",
  hpCurrent: "HPCurrent",
  hpTemp: "HPTemp",
  hdTotal: "HDTotal",
  hd: "HD",
  passive: "Passive",
  attacksSpellcasting: "AttacksSpellcasting",
  proficienciesLang: "ProficienciesLang",
  equipment: "Equipment",
  featuresTraits: "Features and Traits",
  cp: "CP", sp: "SP", ep: "EP", gp: "GP", pp: "PP",
  // page 2
  characterName2: "CharacterName 2",
  personality: "PersonalityTraits ",
  ideals: "Ideals",
  bonds: "Bonds",
  flaws: "Flaws",
  backstory: "Backstory",
  allies: "Allies",
  featTraits2: "Feat+Traits",
  // page 3 spellcasting header
  spellClass: "Spellcasting Class 2",
  spellAbility: "SpellcastingAbility 2",
  spellSaveDc: "SpellSaveDC  2",
  spellAtkBonus: "SpellAtkBonus 2",
} as const;

export const ABILITY_SCORE_FIELD: Record<Ability, string> = {
  str: "STR", dex: "DEX", con: "CON", int: "INT", wis: "WIS", cha: "CHA",
};

export const ABILITY_MOD_FIELD: Record<Ability, string> = {
  str: "STRmod", dex: "DEXmod ", con: "CONmod", int: "INTmod", wis: "WISmod", cha: "CHamod",
};

export const SAVE_FIELD: Record<Ability, string> = {
  str: "ST Strength", dex: "ST Dexterity", con: "ST Constitution",
  int: "ST Intelligence", wis: "ST Wisdom", cha: "ST Charisma",
};

export const SAVE_CHECKBOX: Record<Ability, string> = {
  str: "Check Box 11", dex: "Check Box 18", con: "Check Box 19",
  int: "Check Box 20", wis: "Check Box 21", cha: "Check Box 22",
};

// skill key (from utils/skills.ts) -> total text field (exact trailing spaces)
export const SKILL_FIELD: Record<string, string> = {
  acrobatics: "Acrobatics", animalHandling: "Animal", arcana: "Arcana", athletics: "Athletics",
  deception: "Deception ", history: "History ", insight: "Insight", intimidation: "Intimidation",
  investigation: "Investigation ", medicine: "Medicine", nature: "Nature", perception: "Perception ",
  performance: "Performance", persuasion: "Persuasion", religion: "Religion",
  sleightOfHand: "SleightofHand", stealth: "Stealth ", survival: "Survival",
};

// skill key -> proficiency checkbox
export const SKILL_CHECKBOX: Record<string, string> = {
  acrobatics: "Check Box 23", animalHandling: "Check Box 24", arcana: "Check Box 25",
  athletics: "Check Box 26", deception: "Check Box 27", history: "Check Box 28",
  insight: "Check Box 29", intimidation: "Check Box 30", investigation: "Check Box 31",
  medicine: "Check Box 32", nature: "Check Box 33", perception: "Check Box 34",
  performance: "Check Box 35", persuasion: "Check Box 36", religion: "Check Box 37",
  sleightOfHand: "Check Box 38", stealth: "Check Box 39", survival: "Check Box 40",
};

export const WEAPON_ROWS: { name: string; atk: string; damage: string }[] = [
  { name: "Wpn Name", atk: "Wpn1 AtkBonus", damage: "Wpn1 Damage" },
  { name: "Wpn Name 2", atk: "Wpn2 AtkBonus ", damage: "Wpn2 Damage " },
  { name: "Wpn Name 3", atk: "Wpn3 AtkBonus  ", damage: "Wpn3 Damage " },
];

export const SLOT_FIELDS_BY_LEVEL: Record<number, { total: string; remaining: string }> = {
  1: { total: "SlotsTotal 19", remaining: "SlotsRemaining 19" },
  2: { total: "SlotsTotal 20", remaining: "SlotsRemaining 20" },
  3: { total: "SlotsTotal 21", remaining: "SlotsRemaining 21" },
  4: { total: "SlotsTotal 22", remaining: "SlotsRemaining 22" },
  5: { total: "SlotsTotal 23", remaining: "SlotsRemaining 23" },
  6: { total: "SlotsTotal 24", remaining: "SlotsRemaining 24" },
  7: { total: "SlotsTotal 25", remaining: "SlotsRemaining 25" },
  8: { total: "SlotsTotal 26", remaining: "SlotsRemaining 26" },
  9: { total: "SlotsTotal 27", remaining: "SlotsRemaining 27" },
};

// spell level (0 = cantrips) -> ordered spell-name row fields
export const SPELL_ROWS_BY_LEVEL: Record<number, string[]> = {
  0: ["Spells 1014", "Spells 1016", "Spells 1017", "Spells 1018", "Spells 1019", "Spells 1020", "Spells 1021", "Spells 1022"],
  1: ["Spells 1015", "Spells 1023", "Spells 1024", "Spells 1025", "Spells 1026", "Spells 1027", "Spells 1028", "Spells 1029", "Spells 1030", "Spells 1031", "Spells 1032", "Spells 1033"],
  2: ["Spells 1046", "Spells 1034", "Spells 1035", "Spells 1036", "Spells 1037", "Spells 1038", "Spells 1039", "Spells 1040", "Spells 1041", "Spells 1042", "Spells 1043", "Spells 1044", "Spells 1045"],
  3: ["Spells 1048", "Spells 1047", "Spells 1049", "Spells 1050", "Spells 1051", "Spells 1052", "Spells 1053", "Spells 1054", "Spells 1055", "Spells 1056", "Spells 1057", "Spells 1058", "Spells 1059"],
  4: ["Spells 1061", "Spells 1060", "Spells 1062", "Spells 1063", "Spells 1064", "Spells 1065", "Spells 1066", "Spells 1067", "Spells 1068", "Spells 1069", "Spells 1070", "Spells 1071", "Spells 1072"],
  5: ["Spells 1074", "Spells 1073", "Spells 1075", "Spells 1076", "Spells 1077", "Spells 1078", "Spells 1079", "Spells 1080", "Spells 1081"],
  6: ["Spells 1083", "Spells 1082", "Spells 1084", "Spells 1085", "Spells 1086", "Spells 1087", "Spells 1088", "Spells 1089", "Spells 1090"],
  7: ["Spells 1092", "Spells 1091", "Spells 1093", "Spells 1094", "Spells 1095", "Spells 1096", "Spells 1097", "Spells 1098", "Spells 1099"],
  8: ["Spells 10101", "Spells 10100", "Spells 10102", "Spells 10103", "Spells 10104", "Spells 10105", "Spells 10106"],
  9: ["Spells 10108", "Spells 10107", "Spells 10109", "Spells 101010", "Spells 101011", "Spells 101012", "Spells 101013"],
};
```

- [ ] **Step 2: Write a validation test that every mapped name exists in the real PDF**

Create `test/pdf-field-names.test.ts`:

```ts
import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { PDFDocument } from "pdf-lib";
import {
  SCALAR, ABILITY_SCORE_FIELD, ABILITY_MOD_FIELD, SAVE_FIELD, SAVE_CHECKBOX,
  SKILL_FIELD, SKILL_CHECKBOX, WEAPON_ROWS, SLOT_FIELDS_BY_LEVEL, SPELL_ROWS_BY_LEVEL,
} from "~/utils/pdf-field-names";

let names: Set<string>;

beforeAll(async () => {
  const buf = readFileSync("./public/template/5E_CharacterSheet_Fillable.pdf");
  const pdf = await PDFDocument.load(buf);
  names = new Set(pdf.getForm().getFields().map((f) => f.getName()));
});

const all = () => [
  ...Object.values(SCALAR),
  ...Object.values(ABILITY_SCORE_FIELD), ...Object.values(ABILITY_MOD_FIELD),
  ...Object.values(SAVE_FIELD), ...Object.values(SAVE_CHECKBOX),
  ...Object.values(SKILL_FIELD), ...Object.values(SKILL_CHECKBOX),
  ...WEAPON_ROWS.flatMap((w) => [w.name, w.atk, w.damage]),
  ...Object.values(SLOT_FIELDS_BY_LEVEL).flatMap((s) => [s.total, s.remaining]),
  ...Object.values(SPELL_ROWS_BY_LEVEL).flat(),
];

describe("pdf-field-names", () => {
  it("every mapped field name exists in the template PDF", () => {
    const missing = all().filter((n) => !names.has(n));
    expect(missing).toEqual([]);
  });
});
```

- [ ] **Step 3: Run the test**

Run: `npm test -- pdf-field-names`
Expected: PASS (every mapped name resolves). If any name is missing, re-run `node scripts/discover-pdf-fields.mjs` and fix the constant to match reality.

- [ ] **Step 4: Commit**

```bash
git add app/utils/pdf-field-names.ts test/pdf-field-names.test.ts
git commit -m "feat: add validated PDF field-name constants"
```

---

## Task 3: Extract shared derivations (`character-stats.ts`)

**Files:**
- Create: `app/utils/character-stats.ts`
- Test: `test/character-stats.test.ts`
- Modify: `app/components/AttacksPanel.vue`, `app/components/CombatPanel.vue`, `app/pages/character/[id].vue`

- [ ] **Step 1: Write the failing tests**

Create `test/character-stats.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import type { CharacterDraft } from "~/types/character";
import type { CustomItem } from "~/types/items";
import { createEmptyCharacter } from "~/utils/character";
import { SKILLS } from "~/utils/skills";
import {
  skillBonus, isSkillProficient, isSkillExpert,
  saveBonus, isSaveProficient, defaultArmorClass, passiveScore, computeAttacks,
} from "~/utils/character-stats";

const base = (): CharacterDraft => ({
  ...createEmptyCharacter(),
  abilityScores: { str: 16, dex: 14, con: 12, int: 10, wis: 8, cha: 18 },
});
const skill = (key: string) => SKILLS.find((s) => s.key === key)!;

describe("skillBonus", () => {
  it("adds proficiency when proficient", () => {
    const c = { ...base(), skillProficiencies: ["athletics"] };
    expect(skillBonus(c, skill("athletics"), 2)).toBe(3 + 2); // STR +3
  });
  it("doubles proficiency when expert", () => {
    const c = { ...base(), skillProficiencies: ["arcana"], skillExpertise: ["arcana"] };
    expect(skillBonus(c, skill("arcana"), 2)).toBe(0 + 4); // INT +0
  });
  it("just the mod when untrained", () => {
    expect(skillBonus(base(), skill("stealth"), 2)).toBe(2); // DEX +2
  });
});

describe("saveBonus", () => {
  it("uses explicit proficiencies when present", () => {
    const c = { ...base(), savingThrowProficiencies: ["con" as const] };
    expect(saveBonus(c, "con", 3)).toBe(1 + 3); // CON +1
    expect(isSaveProficient(c, "str")).toBe(false);
  });
  it("falls back to the primary class saves", () => {
    const primary = { data: { savingThrowProficiencies: ["str", "con"] } } as never;
    expect(isSaveProficient(base(), "str", primary)).toBe(true);
    expect(saveBonus(base(), "str", 2, primary)).toBe(3 + 2);
  });
});

describe("defaultArmorClass & passiveScore", () => {
  it("AC is 10 + dex + equipped ac bonuses", () => {
    const items: CustomItem[] = [{ id: "a", name: "Shield", type: "armor", acBonus: 2, createdAt: "" }];
    const c = { ...base(), inventory: [{ id: "e", itemId: "a", quantity: 1, equipped: true }] };
    expect(defaultArmorClass(c, items)).toBe(10 + 2 + 2);
  });
  it("passive perception is 10 + wis + prof when proficient", () => {
    const c = { ...base(), skillProficiencies: ["perception"] };
    expect(passiveScore(c, "perception", 3)).toBe(10 + -1 + 3); // WIS -1
  });
});

describe("computeAttacks", () => {
  it("includes equipped weapons with ability mod + prof", () => {
    const items: CustomItem[] = [{ id: "w", name: "Longsword", type: "weapon", damage: "1d8", damageType: "slashing", damageAbility: "str", createdAt: "" }];
    const c = { ...base(), weaponProficiencies: ["Martial"], inventory: [{ id: "e", itemId: "w", quantity: 1, equipped: true }] };
    const atks = computeAttacks(c, items, 2);
    expect(atks).toHaveLength(1);
    expect(atks[0]!.name).toBe("Longsword");
    expect(atks[0]!.attackBonus).toBe(3 + 2);
    expect(atks[0]!.damage).toBe("1d8 +3");
  });
  it("ignores unequipped and non-weapons", () => {
    const items: CustomItem[] = [{ id: "w", name: "Dagger", type: "weapon", createdAt: "" }];
    const c = { ...base(), inventory: [{ id: "e", itemId: "w", quantity: 1, equipped: false }] };
    expect(computeAttacks(c, items, 2)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- character-stats`
Expected: FAIL — `~/utils/character-stats` does not exist.

- [ ] **Step 3: Create `app/utils/character-stats.ts`**

```ts
import type { CharacterDraft } from "~/types/character";
import type { Ability, ClassData, RulesEntity } from "~/types/rules";
import type { CustomItem } from "~/types/items";
import { abilityModifier } from "~/utils/character";
import { SKILLS, type Skill } from "~/utils/skills";

export const isSkillProficient = (c: CharacterDraft, key: string) =>
  c.skillProficiencies?.includes(key) ?? false;

export const isSkillExpert = (c: CharacterDraft, key: string) =>
  c.skillExpertise?.includes(key) ?? false;

export const skillBonus = (c: CharacterDraft, skill: Skill, profBonus: number) => {
  const mod = abilityModifier(c.abilityScores[skill.ability]);
  if (isSkillExpert(c, skill.key)) return mod + profBonus * 2;
  if (isSkillProficient(c, skill.key)) return mod + profBonus;
  return mod;
};

export const isSaveProficient = (
  c: CharacterDraft,
  ability: Ability,
  primaryClass?: RulesEntity<ClassData>,
) => {
  const explicit = c.savingThrowProficiencies;
  if (explicit && explicit.length) return explicit.includes(ability);
  return primaryClass?.data.savingThrowProficiencies?.includes(ability) ?? false;
};

export const saveBonus = (
  c: CharacterDraft,
  ability: Ability,
  profBonus: number,
  primaryClass?: RulesEntity<ClassData>,
) => abilityModifier(c.abilityScores[ability]) + (isSaveProficient(c, ability, primaryClass) ? profBonus : 0);

export const equippedAcBonus = (c: CharacterDraft, items: CustomItem[]) =>
  (c.inventory ?? [])
    .filter((e) => e.equipped)
    .map((e) => items.find((i) => i.id === e.itemId))
    .reduce((sum, item) => sum + (item?.acBonus ?? 0), 0);

export const defaultArmorClass = (c: CharacterDraft, items: CustomItem[]) =>
  10 + abilityModifier(c.abilityScores.dex) + equippedAcBonus(c, items);

export const passiveScore = (c: CharacterDraft, skillKey: string, profBonus: number) => {
  const skill = SKILLS.find((s) => s.key === skillKey)!;
  const mod = abilityModifier(c.abilityScores[skill.ability]);
  const isExp = c.skillExpertise?.includes(skillKey) ?? false;
  const isProf = c.skillProficiencies?.includes(skillKey) ?? false;
  return 10 + mod + (isExp ? profBonus * 2 : isProf ? profBonus : 0);
};

export type Attack = { id: string; name: string; attackBonus: number; damage: string; damageType: string };

export const computeAttacks = (c: CharacterDraft, items: CustomItem[], profBonus: number): Attack[] =>
  (c.inventory ?? [])
    .filter((e) => e.equipped)
    .map((e) => items.find((i) => i.id === e.itemId))
    .filter((it): it is CustomItem => !!it && it.type === "weapon")
    .map((it, idx) => {
      const ability = it.damageAbility ?? "str";
      const mod = abilityModifier(c.abilityScores[ability]);
      const isProf = (c.weaponProficiencies?.length ?? 0) > 0;
      const bonus = mod + (isProf ? profBonus : 0);
      const dmgBonus = mod >= 0 ? `+${mod}` : String(mod);
      return {
        id: `${it.id}-${idx}`,
        name: it.name,
        attackBonus: bonus,
        damage: it.damage ? `${it.damage}${mod !== 0 ? ` ${dmgBonus}` : ""}` : dmgBonus,
        damageType: it.damageType ?? "",
      };
    });
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npm test -- character-stats`
Expected: PASS.

- [ ] **Step 5: Refactor `AttacksPanel.vue` to use `computeAttacks`**

In `app/components/AttacksPanel.vue` `<script setup>`, replace the local `attacks` computed body with the shared helper. Change the import line `import { abilityModifier, signed } from "~/utils/character";` to:

```ts
import { signed } from "~/utils/character";
import { computeAttacks } from "~/utils/character-stats";
```

Replace the entire `const attacks = computed(() => { ... });` block with:

```ts
const attacks = computed(() => computeAttacks(props.character, library.value, props.profBonus));
```

(`bestAttack` stays unchanged.)

- [ ] **Step 6: Refactor `CombatPanel.vue` to use the shared AC/passive helpers**

In `app/components/CombatPanel.vue`, change `import { abilityModifier } from "~/utils/character";` to:

```ts
import { abilityModifier } from "~/utils/character";
import { defaultArmorClass, passiveScore } from "~/utils/character-stats";
```

**Delete** the local `equippedAcBonus` computed entirely (it's now folded into `defaultArmorClass`). Replace `defaultAc` with:

```ts
const defaultAc = computed(() => defaultArmorClass(props.character, library.value));
```

Replace the `passive` function with:

```ts
const passive = (key: "perception" | "insight" | "investigation") => passiveScore(props.character, key, props.profBonus);
```

Confirm nothing else references the deleted `equippedAcBonus` (grep the file). `defaultInit` keeps using `abilityModifier`, so keep that import.

- [ ] **Step 7: Refactor `[id].vue` skill/save helpers to delegate**

In `app/pages/character/[id].vue`, add to the `~/utils/character-stats` import:

```ts
import {
  skillBonus as statSkillBonus,
  saveBonus as statSaveBonus,
  isSaveProficient as statIsSaveProficient,
  isSkillProficient as statIsSkillProficient,
  isSkillExpert as statIsSkillExpert,
} from "~/utils/character-stats";
```

Replace the bodies of the existing local functions to delegate (keep their names/signatures so the template is untouched):

```ts
const isSaveProficient = (ability: Ability) =>
  statIsSaveProficient(character.value!, ability, primaryEntry.value?.cls);

const saveBonus = (ability: Ability) =>
  character.value ? statSaveBonus(character.value, ability, profBonus.value, primaryEntry.value?.cls) : 0;

const isSkillProficient = (key: string) =>
  character.value ? statIsSkillProficient(character.value, key) : false;

const isSkillExpert = (key: string) =>
  character.value ? statIsSkillExpert(character.value, key) : false;

const skillBonus = (skill: Skill) =>
  character.value ? statSkillBonus(character.value, skill, profBonus.value) : 0;
```

Leave `toggleSaveProficiency` and `cycleSkill` as they are (they mutate, not derive).

- [ ] **Step 8: Verify nothing regressed**

Run: `npx vue-tsc --noEmit -p tsconfig.json` → no errors.
Run: `npm test` → all tests pass (existing 19 + new).
Run: `npm run build` → completes (confirms the three components still compile).

- [ ] **Step 9: Commit**

```bash
git add app/utils/character-stats.ts test/character-stats.test.ts app/components/AttacksPanel.vue app/components/CombatPanel.vue "app/pages/character/[id].vue"
git commit -m "refactor: extract shared character-stats helpers (DRY)"
```

---

## Task 4: Pure field-value mapping (`pdf-field-map.ts`)

**Files:**
- Create: `app/utils/pdf-field-map.ts`
- Test: `test/pdf-field-map.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `test/pdf-field-map.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import type { CharacterDraft } from "~/types/character";
import type { ClassData, RaceData, RulesEntity, SpellData, SubclassData } from "~/types/rules";
import { createEmptyCharacter } from "~/utils/character";
import { buildFieldValues, type PdfExportContext } from "~/utils/pdf-field-map";

const cls = (id: string, name: string, extra: Partial<ClassData> = {}): RulesEntity<ClassData> => ({
  id, kind: "class", name, source: "PHB", sourceType: "core",
  data: {
    page: null, edition: "classic", hitDie: { number: 1, faces: 8 },
    savingThrowProficiencies: [], spellcastingAbility: null, casterProgression: null,
    preparedSpellsFormula: null, cantripProgression: [], spellsKnownProgression: [],
    spellsKnownProgressionFixed: [], spellSlotProgression: [], startingProficiencies: {},
    classFeatures: [], multiclassing: null, ...extra,
  },
});

const wizard = cls("c:wiz", "Wizard", {
  spellcastingAbility: "int", casterProgression: "full",
  savingThrowProficiencies: ["int", "wis"],
  spellSlotProgression: [[2], [3], [4, 2]],
});
const fighter = cls("c:fig", "Fighter", { savingThrowProficiencies: ["str", "con"], hitDie: { number: 1, faces: 10 } });

const ctx = (over: Partial<PdfExportContext> = {}): PdfExportContext => ({
  classes: [wizard, fighter], subclasses: [], spells: [], races: [], items: [], ...over,
});

const baseChar = (): CharacterDraft => ({
  ...createEmptyCharacter(),
  name: "Mage",
  abilityScores: { str: 8, dex: 14, con: 12, int: 16, wis: 10, cha: 10 },
  classes: [{ classId: "c:wiz", subclassId: "", level: 3 }],
});

describe("buildFieldValues", () => {
  it("fills identity and class label", () => {
    const { text } = buildFieldValues(baseChar(), ctx());
    expect(text["CharacterName"]).toBe("Mage");
    expect(text["ClassLevel"]).toBe("Wizard 3");
    expect(text["ProfBonus"]).toBe("+2");
  });

  it("joins multiclass label", () => {
    const c = { ...baseChar(), classes: [
      { classId: "c:wiz", subclassId: "", level: 3 },
      { classId: "c:fig", subclassId: "", level: 2 },
    ] };
    expect(buildFieldValues(c, ctx()).text["ClassLevel"]).toBe("Wizard 3 / Fighter 2");
  });

  it("fills ability scores and signed mods", () => {
    const { text } = buildFieldValues(baseChar(), ctx());
    expect(text["INT"]).toBe("16");
    expect(text["INTmod"]).toBe("+3");
    expect(text["STR"]).toBe("8");
    expect(text["STRmod"]).toBe("-1");
  });

  it("checks save proficiency from the primary class and fills totals", () => {
    const { text, checks } = buildFieldValues(baseChar(), ctx());
    expect(checks["Check Box 20"]).toBe(true); // INT save (wizard)
    expect(text["ST Intelligence"]).toBe("+5"); // +3 mod +2 prof
    expect(checks["Check Box 11"]).toBeFalsy(); // STR save not proficient
  });

  it("fills the spellcasting header and slot totals for a caster", () => {
    const { text } = buildFieldValues(baseChar(), ctx());
    expect(text["Spellcasting Class 2"]).toBe("Wizard");
    expect(text["SpellcastingAbility 2"]).toBe("INT");
    expect(text["SpellSaveDC  2"]).toBe("13"); // 8 + 3 + 2
    expect(text["SpellAtkBonus 2"]).toBe("+5");
    expect(text["SlotsTotal 1"] === undefined).toBe(true); // sanity: we key by real names
    expect(text["SlotsTotal 19"]).toBe("4"); // wizard L3 -> [4,2]
    expect(text["SlotsTotal 20"]).toBe("2");
  });

  it("leaves spell header blank for a non-caster", () => {
    const c = { ...baseChar(), classes: [{ classId: "c:fig", subclassId: "", level: 5 }] };
    const { text } = buildFieldValues(c, ctx());
    expect(text["Spellcasting Class 2"]).toBeUndefined();
  });

  it("places known spells into their level rows", () => {
    const fireball: RulesEntity<SpellData> = {
      id: "s:fb", kind: "spell", name: "Fireball", source: "PHB", sourceType: "core",
      data: { page: null, level: 3, school: "V", time: [], range: null, components: {}, duration: [], entries: [], entriesHigherLevel: [], damageInflict: [], savingThrow: [], spellAttack: [], miscTags: [], areaTags: [], classes: [], classVariants: [], subclasses: [] },
    };
    const c = { ...baseChar(), selectedSpellIds: ["s:fb"] };
    const { text } = buildFieldValues(c, ctx({ spells: [fireball] }));
    expect(text["Spells 1048"]).toBe("Fireball"); // first level-3 row
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- pdf-field-map`
Expected: FAIL — module missing.

- [ ] **Step 3: Create `app/utils/pdf-field-map.ts`**

```ts
import type { CharacterDraft } from "~/types/character";
import type { Ability, ClassData, RaceData, RulesEntity, SpellData, SubclassData } from "~/types/rules";
import type { CustomItem } from "~/types/items";
import { abilityModifier, proficiencyBonus, signed } from "~/utils/character";
import { totalLevel, effectiveSpellSlots, pactSlots, hitDiceLabel, type ClassLookup } from "~/utils/multiclass";
import { SKILLS } from "~/utils/skills";
import { skillBonus, saveBonus, isSaveProficient, isSkillProficient, isSkillExpert, defaultArmorClass, passiveScore, computeAttacks } from "~/utils/character-stats";
import {
  SCALAR, ABILITY_SCORE_FIELD, ABILITY_MOD_FIELD, SAVE_FIELD, SAVE_CHECKBOX,
  SKILL_FIELD, SKILL_CHECKBOX, WEAPON_ROWS, SLOT_FIELDS_BY_LEVEL, SPELL_ROWS_BY_LEVEL,
} from "~/utils/pdf-field-names";

export type PdfExportContext = {
  classes: RulesEntity<ClassData>[];
  subclasses: RulesEntity<SubclassData>[];
  spells: RulesEntity<SpellData>[];
  races: RulesEntity<RaceData>[];
  items: CustomItem[];
};

export type PdfFieldValues = { text: Record<string, string>; checks: Record<string, boolean> };

const ABILITIES: Ability[] = ["str", "dex", "con", "int", "wis", "cha"];

export const buildFieldValues = (c: CharacterDraft, ctx: PdfExportContext): PdfFieldValues => {
  const text: Record<string, string> = {};
  const checks: Record<string, boolean> = {};
  const setT = (name: string, value: string | number | undefined | null) => {
    if (value === undefined || value === null) return;
    const s = `${value}`;
    if (s !== "") text[name] = s;
  };

  const entries = c.classes ?? [];
  const resolved = entries.map((e) => ({
    e,
    cls: ctx.classes.find((k) => k.id === e.classId),
    sub: ctx.subclasses.find((s) => s.id === e.subclassId),
  }));
  const lookup: ClassLookup = (id) => ctx.classes.find((k) => k.id === id);
  const lvl = entries.length ? totalLevel(entries) : (c.level ?? 1);
  const prof = proficiencyBonus(lvl);
  const primaryClass = resolved[0]?.cls;

  // --- Identity ---
  setT(SCALAR.characterName, c.name);
  setT(SCALAR.characterName2, c.name);
  setT(SCALAR.classLevel, resolved.map((r) => `${r.cls?.name ?? ""} ${r.e.level}`.trim()).filter(Boolean).join(" / "));
  setT(SCALAR.race, ctx.races.find((r) => r.id === c.raceId)?.name ?? "");
  setT(SCALAR.background, c.background?.name ?? "");
  setT(SCALAR.alignment, c.background?.alignment ?? "");
  setT(SCALAR.xp, c.background?.experience ?? "");
  setT(SCALAR.profBonus, signed(prof));

  // --- Abilities, saves ---
  for (const ab of ABILITIES) {
    setT(ABILITY_SCORE_FIELD[ab], c.abilityScores[ab]);
    setT(ABILITY_MOD_FIELD[ab], signed(abilityModifier(c.abilityScores[ab])));
    setT(SAVE_FIELD[ab], signed(saveBonus(c, ab, prof, primaryClass)));
    if (isSaveProficient(c, ab, primaryClass)) checks[SAVE_CHECKBOX[ab]] = true;
  }

  // --- Skills ---
  for (const skill of SKILLS) {
    setT(SKILL_FIELD[skill.key], signed(skillBonus(c, skill, prof)));
    if (isSkillProficient(c, skill.key) || isSkillExpert(c, skill.key)) {
      checks[SKILL_CHECKBOX[skill.key]] = true;
    }
  }
  setT(SCALAR.passive, passiveScore(c, "perception", prof));

  // --- Combat ---
  setT(SCALAR.ac, c.armorClass ?? defaultArmorClass(c, ctx.items));
  setT(SCALAR.initiative, signed(c.initiativeBonus ?? abilityModifier(c.abilityScores.dex)));
  setT(SCALAR.speed, c.speed ?? "");
  setT(SCALAR.hpMax, c.maxHp);
  setT(SCALAR.hpCurrent, c.currentHp);
  setT(SCALAR.hpTemp, c.temporaryHp || "");
  setT(SCALAR.hdTotal, hitDiceLabel(entries, lookup));
  if (c.inspiration) text["Inspiration"] = "Yes";

  // --- Attacks ---
  const attacks = computeAttacks(c, ctx.items, prof);
  WEAPON_ROWS.forEach((row, i) => {
    const a = attacks[i];
    if (!a) return;
    setT(row.name, a.name);
    setT(row.atk, signed(a.attackBonus));
    setT(row.damage, `${a.damage}${a.damageType ? ` ${a.damageType}` : ""}`);
  });

  // --- Proficiencies & languages, equipment, features ---
  const profLines = [
    ...(c.languages ?? []),
    ...(c.toolProficiencies ?? []),
    ...(c.weaponProficiencies ?? []),
    ...(c.armorProficiencies ?? []),
    ...(c.weaponMasteries ?? []),
  ];
  setT(SCALAR.proficienciesLang, profLines.join(", "));

  const equipment = (c.inventory ?? [])
    .map((e) => ctx.items.find((i) => i.id === e.itemId))
    .filter((it): it is CustomItem => !!it)
    .map((it) => it.name)
    .join(", ");
  setT(SCALAR.equipment, equipment);

  // --- Currency ---
  setT(SCALAR.cp, c.currency.cp || "");
  setT(SCALAR.sp, c.currency.sp || "");
  setT(SCALAR.gp, c.currency.gp || "");
  setT(SCALAR.pp, c.currency.pp || "");

  // --- Page 2 ---
  setT(SCALAR.personality, c.background?.personalityTraits ?? "");
  setT(SCALAR.ideals, c.background?.ideals ?? "");
  setT(SCALAR.bonds, c.background?.bonds ?? "");
  setT(SCALAR.flaws, c.background?.flaws ?? "");
  const backstory = [c.background?.appearance, c.background?.backstory].filter(Boolean).join("\n\n");
  setT(SCALAR.backstory, backstory);
  const allies = (c.relations ?? []).map((r) => [r.name, r.race, r.status].filter(Boolean).join(" — ")).join("\n");
  setT(SCALAR.allies, allies);

  // --- Page 3 spellcasting ---
  const primaryCaster = resolved.find((r) => r.cls?.data.spellcastingAbility);
  if (primaryCaster?.cls) {
    const ability = primaryCaster.cls.data.spellcastingAbility as Ability;
    const mod = abilityModifier(c.abilityScores[ability]);
    const attack = mod + prof;
    setT(SCALAR.spellClass, primaryCaster.cls.name);
    setT(SCALAR.spellAbility, ability.toUpperCase());
    setT(SCALAR.spellSaveDc, 8 + attack);
    setT(SCALAR.spellAtkBonus, signed(attack));

    // slot totals (fold pact slots into their level)
    const slots = effectiveSpellSlots(entries, lookup);
    const pact = pactSlots(entries, lookup);
    for (let level = 1; level <= 9; level++) {
      let total = slots[level - 1] ?? 0;
      if (pact && pact.level === level) total += pact.count;
      const fields = SLOT_FIELDS_BY_LEVEL[level];
      if (!fields || total <= 0) continue;
      setT(fields.total, total);
      const used = c.usedSpellSlots?.[level - 1] ?? 0;
      setT(fields.remaining, Math.max(0, total - used));
    }

    // known spells into level rows (truncate at row limits)
    const known = ctx.spells
      .filter((s) => c.selectedSpellIds.includes(s.id))
      .sort((a, b) => a.data.level - b.data.level || a.name.localeCompare(b.name));
    const byLevel = new Map<number, RulesEntity<SpellData>[]>();
    for (const s of known) {
      const l = s.data.level;
      if (!byLevel.has(l)) byLevel.set(l, []);
      byLevel.get(l)!.push(s);
    }
    for (const [level, list] of byLevel) {
      const rows = SPELL_ROWS_BY_LEVEL[level];
      if (!rows) continue;
      list.slice(0, rows.length).forEach((s, i) => setT(rows[i]!, s.name));
    }
  }

  return { text, checks };
};
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npm test -- pdf-field-map`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/utils/pdf-field-map.ts test/pdf-field-map.test.ts
git commit -m "feat: pure character->PDF field value mapping"
```

---

## Task 5: PDF export orchestrator (`pdf-export.ts`)

**Files:**
- Create: `app/utils/pdf-export.ts`

- [ ] **Step 1: Create `app/utils/pdf-export.ts`**

```ts
import { PDFDocument } from "pdf-lib";
import type { CharacterDraft } from "~/types/character";
import { buildFieldValues, type PdfExportContext } from "~/utils/pdf-field-map";

const TEMPLATE_URL = "/template/5E_CharacterSheet_Fillable.pdf";

export const exportCharacterPdf = async (
  character: CharacterDraft,
  ctx: PdfExportContext,
): Promise<Uint8Array> => {
  const res = await fetch(TEMPLATE_URL);
  if (!res.ok) throw new Error(`Could not load PDF template (${res.status})`);
  const bytes = new Uint8Array(await res.arrayBuffer());

  const pdf = await PDFDocument.load(bytes);
  const form = pdf.getForm();
  const { text, checks } = buildFieldValues(character, ctx);

  for (const [name, value] of Object.entries(text)) {
    try {
      form.getTextField(name).setText(value);
    } catch {
      // field absent or wrong type in this template version — skip
    }
  }
  for (const [name, on] of Object.entries(checks)) {
    try {
      const box = form.getCheckBox(name);
      if (on) box.check(); else box.uncheck();
    } catch {
      // skip missing checkbox
    }
  }

  form.flatten();
  return pdf.save();
};

export const downloadCharacterPdf = async (
  character: CharacterDraft,
  ctx: PdfExportContext,
): Promise<void> => {
  const bytes = await exportCharacterPdf(character, ctx);
  const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${character.name || "character"}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
};
```

- [ ] **Step 2: Typecheck**

Run: `npx vue-tsc --noEmit -p tsconfig.json`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/utils/pdf-export.ts
git commit -m "feat: PDF export orchestrator with safe field setters"
```

---

## Task 6: Export button on the character sheet

**Files:**
- Modify: `app/pages/character/[id].vue`

- [ ] **Step 1: Add the export handler in `<script setup>`**

In `app/pages/character/[id].vue`, add an import:

```ts
import { downloadCharacterPdf } from "~/utils/pdf-export";
```

The sheet already loads everything needed via `useFetch`: `classes`, `subclasses`, `spells`, and `races` (used by `selectedRace`), plus the item library destructured as `const { items: itemLib, load: loadItemLib } = useItemLibrary();`. Reuse those refs — do not add new fetches.

Add the handler:

```ts
const exporting = ref(false);
const exportPdf = async () => {
  if (!character.value || exporting.value) return;
  exporting.value = true;
  try {
    await downloadCharacterPdf(character.value, {
      classes: classes.value,
      subclasses: subclasses.value,
      spells: spells.value,
      races: races.value,
      items: itemLib.value,
    });
  } catch (e) {
    await askConfirm({
      title: "Export failed",
      message: e instanceof Error ? e.message : "Could not generate the PDF.",
      confirmLabel: "OK",
    });
  } finally {
    exporting.value = false;
  }
};
```

- [ ] **Step 2: Add the button in the header actions**

In the `.header-actions` div (next to Share / Delete), add:

```html
        <button type="button" class="ghost-button" :disabled="exporting" @click="exportPdf">
          {{ exporting ? "Exporting…" : "Export PDF" }}
        </button>
```

- [ ] **Step 3: Typecheck + build**

Run: `npx vue-tsc --noEmit -p tsconfig.json` → no errors.
Run: `npm run build` → completes.

- [ ] **Step 4: Manual verification (the real test for the binary fill)**

Run: `npm run dev`. Open an existing multiclass caster:
- Click **Export PDF** → a `<name>.pdf` downloads.
- Open it: page 1 shows class/level label, abilities + mods, save/skill checkboxes + totals, AC/HP/speed/init, proficiency bonus, passive perception, attacks from equipped weapons, proficiencies, equipment, currency.
- Page 2 shows personality/ideals/bonds/flaws, backstory (appearance + backstory), allies.
- Page 3 shows the primary caster's class/ability/DC/attack, slot totals per level, and known spells in their level rows.
Open a non-caster (e.g. a Fighter) and confirm page 3 is blank and no errors occur.
Stop the server.

- [ ] **Step 5: Commit**

```bash
git add "app/pages/character/[id].vue"
git commit -m "feat: Export PDF button on character sheet"
```

---

## Final verification

- [ ] **Step 1:** Run `npm test` → all tests pass (19 prior + pdf-field-names + character-stats + pdf-field-map).
- [ ] **Step 2:** Run `npm run build` → completes with no errors.
- [ ] **Step 3:** Manual: export a martial character and a multiclass caster; open both PDFs and confirm fields land correctly and page 3 is blank for the non-caster.
- [ ] **Step 4:** Dispatch a final code review over `git diff main...HEAD`.
