# Multiclassing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a character hold multiple classes (each with its own subclass and level) across the creation page and the character sheet, with 5e RAW multiclass spell slots.

**Architecture:** A new `classes: ClassEntry[]` array on `CharacterDraft` becomes the source of truth (`classes[0]` is the primary class). Legacy scalar `classId`/`subclassId`/`level` fields are kept and auto-migrated by `normalizeCharacter`. Pure multiclass math lives in a new, unit-tested `app/utils/multiclass.ts`. A shared `<ClassesEditor>` component drives both pages; the sheet renders per-class features, resources, and spellcasting panels.

**Tech Stack:** Nuxt 4 SPA (Vue 3, TypeScript), localStorage persistence, Vitest (new) for unit tests.

---

## Reference design

Spec: `docs/superpowers/specs/2026-05-26-multiclassing-design.md`.

### Known limitations (intentional, do not "fix")
- Ability prerequisites only **warn**, never block. Warnings are approximate (e.g. Fighter shows STR 13 even though RAW allows STR *or* DEX).
- Third-caster subclasses (Eldritch Knight, Arcane Trickster) contribute **0** to combined caster level (the data has no subclass `casterProgression`); slots can be hand-edited.
- Homebrew **classes** are not selectable in the multiclass picker (official rules data only). Homebrew spells/races/subraces are unaffected.
- HP stays manual; hit dice show as a per-class label only.
- `CombatModal` recap is not reworked (still uses the primary class).

### File structure
- Create: `app/utils/multiclass.ts` — pure multiclass math.
- Create: `app/components/ClassesEditor.vue` — shared class/subclass/level editor.
- Create: `vitest.config.ts`, `test/multiclass.test.ts`, `test/normalize-character.test.ts`.
- Modify: `app/types/character.ts` — add `ClassEntry`, `classes`.
- Modify: `app/utils/character.ts` — add `classes` to `createEmptyCharacter`; add exported `normalizeCharacter`.
- Modify: `app/composables/useCharacters.ts` — use the shared `normalizeCharacter`.
- Modify: `app/pages/character/new.vue` — use `ClassesEditor`, union spell filter.
- Modify: `app/pages/character/[id].vue` — per-class rendering, multiclass slots, header, prof/saves, editor.
- Modify: `app/components/SpellPreparationPanel.vue` — add `classLevel` prop.
- Modify: `app/components/CombatPanel.vue` — replace `hitDieFaces` prop with `hitDiceLabel`.
- Modify: `package.json` — Vitest dev dep + `test` scripts.

---

## Task 1: Vitest tooling

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`

- [ ] **Step 1: Install Vitest**

Run: `npm install -D vitest`
Expected: `vitest` added under `devDependencies`.

- [ ] **Step 2: Add test scripts to `package.json`**

In the `"scripts"` block, add these two entries (keep existing ones):

```json
    "test": "vitest run",
    "test:watch": "vitest"
```

- [ ] **Step 3: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "~": fileURLToPath(new URL("./app", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
  },
});
```

- [ ] **Step 4: Verify the runner starts**

Run: `npm test`
Expected: Vitest runs and reports "No test files found" (or similar). No crash.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "chore: add vitest test runner"
```

---

## Task 2: Add `ClassEntry` to the type model

**Files:**
- Modify: `app/types/character.ts`

- [ ] **Step 1: Add the `ClassEntry` type and `classes` field**

In `app/types/character.ts`, add this type near the top (after the `Relation`/`InventoryEntry` types, before `CharacterDraft`):

```ts
export type ClassEntry = {
  classId: string;
  subclassId: string;
  level: number;
};
```

Then inside `CharacterDraft`, add the `classes` field immediately after the existing `subclassId: string;` line:

```ts
  classes: ClassEntry[];
```

Leave the legacy `classId` / `subclassId` / `level` fields exactly as they are (used for migration + compat).

- [ ] **Step 2: Typecheck**

Run: `npx nuxt typecheck` (if it errors that typecheck isn't configured, run `npx vue-tsc --noEmit -p tsconfig.json`)
Expected: errors only where `createEmptyCharacter` / `normalizeCharacter` don't yet provide `classes` — those are fixed in Task 4. No errors in `types/character.ts` itself.

- [ ] **Step 3: Commit**

```bash
git add app/types/character.ts
git commit -m "feat: add ClassEntry type and classes field"
```

---

## Task 3: Pure multiclass math (`app/utils/multiclass.ts`)

**Files:**
- Create: `app/utils/multiclass.ts`
- Create: `test/multiclass.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `test/multiclass.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import type { ClassData, RulesEntity } from "~/types/rules";
import type { ClassEntry } from "~/types/character";
import {
  totalLevel,
  casterLevel,
  multiclassSpellSlots,
  effectiveSpellSlots,
  pactSlots,
  type ClassLookup,
} from "~/utils/multiclass";

// Minimal fake class factory for tests.
const makeClass = (
  id: string,
  casterProgression: ClassData["casterProgression"],
  spellSlotProgression: number[][] = [],
): RulesEntity<ClassData> => ({
  id,
  kind: "class",
  name: id,
  source: "TEST",
  sourceType: "core",
  data: {
    page: null, edition: "classic", hitDie: { number: 1, faces: 8 },
    savingThrowProficiencies: [], spellcastingAbility: null,
    casterProgression, preparedSpellsFormula: null,
    cantripProgression: [], spellsKnownProgression: [],
    spellsKnownProgressionFixed: [], spellSlotProgression,
    startingProficiencies: {}, classFeatures: [], multiclassing: null,
  },
});

const wizard = makeClass("wizard", "full", [[2], [3], [4, 2]]);
const cleric = makeClass("cleric", "full");
const paladin = makeClass("paladin", "1/2");
const artificer = makeClass("artificer", "artificer");
const warlock = makeClass("warlock", "pact");
const fighter = makeClass("fighter", null);

const lookupFrom = (...cs: RulesEntity<ClassData>[]): ClassLookup => {
  const map = new Map(cs.map((c) => [c.id, c]));
  return (id: string) => map.get(id);
};

const entry = (classId: string, level: number): ClassEntry => ({ classId, subclassId: "", level });

describe("totalLevel", () => {
  it("sums entry levels", () => {
    expect(totalLevel([entry("wizard", 3), entry("cleric", 2)])).toBe(5);
  });
  it("is 0 for empty", () => {
    expect(totalLevel([])).toBe(0);
  });
});

describe("casterLevel", () => {
  const lookup = lookupFrom(wizard, cleric, paladin, artificer, warlock, fighter);
  it("adds full casters at full level", () => {
    expect(casterLevel([entry("wizard", 3), entry("cleric", 2)], lookup)).toBe(5);
  });
  it("adds half casters rounded down", () => {
    expect(casterLevel([entry("paladin", 5)], lookup)).toBe(2);
  });
  it("adds artificer rounded up", () => {
    expect(casterLevel([entry("artificer", 5)], lookup)).toBe(3);
  });
  it("excludes warlock and non-casters", () => {
    expect(casterLevel([entry("warlock", 5), entry("fighter", 4)], lookup)).toBe(0);
  });
});

describe("multiclassSpellSlots", () => {
  it("returns the level-5 row padded to 9", () => {
    expect(multiclassSpellSlots(5)).toEqual([4, 3, 2, 0, 0, 0, 0, 0, 0]);
  });
  it("returns empty below 1", () => {
    expect(multiclassSpellSlots(0)).toEqual([]);
  });
  it("clamps above 20", () => {
    expect(multiclassSpellSlots(99)).toEqual(multiclassSpellSlots(20));
  });
});

describe("effectiveSpellSlots", () => {
  it("uses the single class native progression for one caster", () => {
    const lookup = lookupFrom(wizard, fighter);
    expect(effectiveSpellSlots([entry("wizard", 3), entry("fighter", 2)], lookup)).toEqual([4, 2]);
  });
  it("uses the multiclass table for two casters", () => {
    const lookup = lookupFrom(wizard, cleric);
    expect(effectiveSpellSlots([entry("wizard", 3), entry("cleric", 2)], lookup)).toEqual(
      multiclassSpellSlots(5),
    );
  });
  it("returns empty with no casters", () => {
    const lookup = lookupFrom(fighter);
    expect(effectiveSpellSlots([entry("fighter", 5)], lookup)).toEqual([]);
  });
});

describe("pactSlots", () => {
  const lookup = lookupFrom(warlock, wizard);
  it("returns warlock pact slots by level", () => {
    expect(pactSlots([entry("warlock", 5), entry("wizard", 2)], lookup)).toEqual({ count: 2, level: 3 });
  });
  it("returns null without a warlock", () => {
    expect(pactSlots([entry("wizard", 5)], lookup)).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — cannot resolve `~/utils/multiclass`.

- [ ] **Step 3: Implement `app/utils/multiclass.ts`**

```ts
import type { CharacterDraft, ClassEntry } from "~/types/character";
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
```

Note: `CharacterDraft` is imported for downstream callers' convenience even though these functions take `ClassEntry[]`; keep the import (it documents the module's domain). If your linter flags it as unused, change it to `import type { ClassEntry } from "~/types/character";` only.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS — all `multiclass.test.ts` tests green.

- [ ] **Step 5: Commit**

```bash
git add app/utils/multiclass.ts test/multiclass.test.ts
git commit -m "feat: add pure multiclass slot/caster-level utilities"
```

---

## Task 4: Migration via shared `normalizeCharacter`

**Files:**
- Modify: `app/utils/character.ts`
- Modify: `app/composables/useCharacters.ts`
- Create: `test/normalize-character.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `test/normalize-character.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { normalizeCharacter } from "~/utils/character";

describe("normalizeCharacter", () => {
  it("migrates legacy scalar class into classes[]", () => {
    const out = normalizeCharacter({
      id: "x", classId: "class:phb:wizard", subclassId: "sub:phb:evoker", level: 3,
    });
    expect(out.classes).toEqual([
      { classId: "class:phb:wizard", subclassId: "sub:phb:evoker", level: 3 },
    ]);
    expect(out.level).toBe(3);
  });

  it("recomputes total level from multiple classes", () => {
    const out = normalizeCharacter({
      classes: [
        { classId: "a", subclassId: "", level: 3 },
        { classId: "b", subclassId: "", level: 2 },
      ],
    });
    expect(out.level).toBe(5);
    expect(out.classId).toBe("a");
  });

  it("is idempotent", () => {
    const once = normalizeCharacter({ classId: "a", level: 2 });
    const twice = normalizeCharacter(once);
    expect(twice.classes).toEqual(once.classes);
    expect(twice.level).toBe(once.level);
  });

  it("keeps manual level when there is no class", () => {
    const out = normalizeCharacter({ level: 4 });
    expect(out.classes).toEqual([]);
    expect(out.level).toBe(4);
  });

  it("maps legacy gold into currency", () => {
    const out = normalizeCharacter({ gold: 15 } as never);
    expect(out.currency.gp).toBe(15);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `normalizeCharacter` is not exported from `~/utils/character`.

- [ ] **Step 3: Add `classes: []` to `createEmptyCharacter` and export `normalizeCharacter`**

In `app/utils/character.ts`, update the imports at the top to include `ClassEntry` and `totalLevel`:

```ts
import type { AbilityScores, CharacterDraft, ClassEntry } from "~/types/character";
import type { Ability, ClassData, RulesEntity } from "~/types/rules";
import { totalLevel } from "~/utils/multiclass";
```

In `createEmptyCharacter`, add `classes: []` right after the `subclassId: "",` line:

```ts
    subclassId: "",
    classes: [],
```

Then append this exported function to the end of the file:

```ts
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

  const level = classes.length ? totalLevel(classes) : (merged.level ?? 1);

  return {
    ...merged,
    classes,
    level,
    classId: classes[0]?.classId ?? merged.classId ?? "",
    subclassId: classes[0]?.subclassId ?? merged.subclassId ?? "",
  };
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS — all `normalize-character.test.ts` tests green.

- [ ] **Step 5: Use the shared `normalizeCharacter` in `useCharacters.ts`**

In `app/composables/useCharacters.ts`, replace the local `normalizeCharacter` definition with an import. Change the imports at the top:

```ts
import type { CharacterDraft } from "~/types/character";
import { normalizeCharacter } from "~/utils/character";
```

Then **delete** the entire local `const normalizeCharacter = (...) => ({...});` block (lines defining it). Leave `readCharacters`, `useCharacters`, and the rest unchanged — they already call `normalizeCharacter(...)`.

- [ ] **Step 6: Verify dev server boots and tests still pass**

Run: `npm test`
Expected: PASS.
Run: `npm run dev`, open an existing character — it loads with no errors (legacy character migrated to a single-entry `classes`). Stop the dev server.

- [ ] **Step 7: Commit**

```bash
git add app/utils/character.ts app/composables/useCharacters.ts test/normalize-character.test.ts
git commit -m "feat: migrate single-class drafts to classes[] via shared normalizeCharacter"
```

---

## Task 5: Shared `<ClassesEditor>` component

**Files:**
- Create: `app/components/ClassesEditor.vue`

- [ ] **Step 1: Create the component**

```vue
<template>
  <div class="classes-editor">
    <div v-for="(entry, idx) in modelValue" :key="idx" class="class-row">
      <label class="cls">Class
        <select
          :value="entry.classId"
          @change="updateEntry(idx, { classId: ($event.target as HTMLSelectElement).value, subclassId: '' })"
        >
          <option value="">Choose a class</option>
          <option v-for="o in classOptions" :key="o.id" :value="o.id">
            {{ o.name }} ({{ o.source }}){{ o.sourceType === 'ua' ? ' [UA]' : '' }}
          </option>
        </select>
      </label>

      <label class="sub">Subclass
        <select
          :value="entry.subclassId"
          :disabled="!subclassOptionsFor(entry.classId).length"
          @change="updateEntry(idx, { subclassId: ($event.target as HTMLSelectElement).value })"
        >
          <option value="">Choose a subclass</option>
          <option v-for="o in subclassOptionsFor(entry.classId)" :key="o.id" :value="o.id">
            {{ o.name }} ({{ o.source }})
          </option>
        </select>
      </label>

      <label class="lvl">Level
        <input
          type="number" min="1" max="20"
          :value="entry.level"
          @input="updateEntry(idx, { level: clampLevel(Number(($event.target as HTMLInputElement).value)) })"
        />
      </label>

      <button type="button" class="remove" aria-label="Remove class" @click="removeEntry(idx)">×</button>

      <p v-if="prereqWarning(entry)" class="prereq-warn">⚠ {{ prereqWarning(entry) }}</p>
    </div>

    <div class="editor-foot">
      <button type="button" class="ghost-button" :disabled="!canAdd" @click="addEntry">+ Add class</button>
      <span class="total">Total level {{ total }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AbilityScores, ClassEntry } from "~/types/character";
import type { Ability, ClassData, RulesEntity, SubclassData } from "~/types/rules";
import { totalLevel } from "~/utils/multiclass";

const props = defineProps<{
  modelValue: ClassEntry[];
  classes: RulesEntity<ClassData>[];
  subclasses: RulesEntity<SubclassData>[];
  abilityScores?: AbilityScores;
}>();

const emit = defineEmits<{ "update:modelValue": [ClassEntry[]] }>();

const clampLevel = (n: number) =>
  Math.max(1, Math.min(20, Number.isFinite(n) ? Math.floor(n) : 1));

const classOptions = computed(() =>
  props.classes
    .filter((item) => item.data.edition === "classic")
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name) || a.source.localeCompare(b.source))
    .map((c) => ({ id: c.id, name: c.name, source: c.source, sourceType: c.sourceType })),
);

const classById = (id: string) => props.classes.find((c) => c.id === id);

const subclassOptionsFor = (classId: string) => {
  const cls = classById(classId);
  if (!cls) return [];
  return props.subclasses
    .filter((s) =>
      s.data.className === cls.name
      && s.data.classSource === cls.source
      && s.data.subclassFeatures.length > 0,
    )
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name) || a.source.localeCompare(b.source))
    .map((s) => ({ id: s.id, name: s.name, source: s.source }));
};

const total = computed(() => totalLevel(props.modelValue));
const canAdd = computed(() => total.value < 20);

const updateEntry = (idx: number, patch: Partial<ClassEntry>) => {
  emit("update:modelValue", props.modelValue.map((e, i) => (i === idx ? { ...e, ...patch } : e)));
};

const addEntry = () =>
  emit("update:modelValue", [...props.modelValue, { classId: "", subclassId: "", level: 1 }]);

const removeEntry = (idx: number) =>
  emit("update:modelValue", props.modelValue.filter((_, i) => i !== idx));

const PREREQS: Record<string, Partial<Record<Ability, number>>> = {
  Barbarian: { str: 13 }, Bard: { cha: 13 }, Cleric: { wis: 13 }, Druid: { wis: 13 },
  Fighter: { str: 13 }, Monk: { dex: 13, wis: 13 }, Paladin: { str: 13, cha: 13 },
  Ranger: { dex: 13, wis: 13 }, Rogue: { dex: 13 }, Sorcerer: { cha: 13 },
  Warlock: { cha: 13 }, Wizard: { int: 13 }, Artificer: { int: 13 },
};

const prereqWarning = (entry: ClassEntry): string => {
  if (!props.abilityScores) return "";
  const cls = classById(entry.classId);
  if (!cls) return "";
  const req = PREREQS[cls.name];
  if (!req) return "";
  const missing = (Object.entries(req) as [Ability, number][])
    .filter(([ab, min]) => (props.abilityScores![ab] ?? 0) < min)
    .map(([ab, min]) => `${ab.toUpperCase()} ${min}`);
  return missing.length ? `${cls.name} usually requires ${missing.join(", ")}` : "";
};
</script>

<style scoped>
.classes-editor { display: grid; gap: 12px; }

.class-row {
  display: grid;
  grid-template-columns: 1fr 1fr 80px 36px;
  gap: 10px;
  align-items: end;
}
.class-row .prereq-warn { grid-column: 1 / -1; }

.class-row label { display: grid; gap: 4px; }

.remove {
  width: 36px; height: 38px; min-height: auto; padding: 0;
  border: 1px solid var(--rubric-deep);
  border-radius: 4px;
  background: transparent;
  color: var(--rubric);
  font-size: 1.2rem;
  line-height: 1;
}
.remove:hover { background: var(--rubric-deep); color: var(--ink); }

.prereq-warn {
  margin: 2px 0 0;
  font-size: 0.82rem;
  color: var(--gilt);
  font-style: italic;
}

.editor-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.editor-foot .total {
  font-family: "IM Fell English SC", serif;
  letter-spacing: 0.14em;
  font-size: 0.82rem;
  color: var(--ink-soft);
}

@media (max-width: 560px) {
  .class-row { grid-template-columns: 1fr 1fr; }
  .class-row .lvl { grid-column: 1; }
  .class-row .remove { grid-column: 2; justify-self: end; }
}
</style>
```

- [ ] **Step 2: Typecheck the component compiles**

Run: `npm run dev`
Expected: dev server boots with no compile error referencing `ClassesEditor`. Stop the server. (It isn't mounted yet; this just confirms it parses. Nuxt auto-imports `computed`/`defineProps`.)

- [ ] **Step 3: Commit**

```bash
git add app/components/ClassesEditor.vue
git commit -m "feat: add shared ClassesEditor component"
```

---

## Task 6: Creation page uses `ClassesEditor`

**Files:**
- Modify: `app/pages/character/new.vue`

- [ ] **Step 1: Replace the Class/Subclass/Level inputs in the template**

In `app/pages/character/new.vue`, in the `.form-grid` block, **remove** these three blocks: the `<label>Level ...` input, the `<label>Class ...<select v-model="draft.classId">...` block, and the `<label>Subclass ...<select v-model="draft.subclassId">...` block. Keep the Name, Race, and Max HP fields.

Immediately **after** the closing `</div>` of `.form-grid`, insert:

```html
      <div class="section-heading classes-heading">
        <div><p class="eyebrow">Classes</p><h2>Class & levels</h2></div>
      </div>
      <ClassesEditor
        v-model="draft.classes"
        :classes="classes ?? []"
        :subclasses="subclasses ?? []"
        :ability-scores="draft.abilityScores"
      />
```

- [ ] **Step 2: Rework the script for multiclass**

Replace the `<script setup lang="ts">` body's class-dependent computeds and watchers. Specifically:

Replace the `selectedClass` / `selectedSubclass` / `subclassOptions` computeds (they are no longer needed for a single class) with a primary-class computed and a per-entry resolver:

```ts
const primaryClass = computed(() =>
  classes.value.find((c) => c.id === draft.classes[0]?.classId),
);

const resolvedEntries = computed(() =>
  draft.classes.map((entry) => ({
    entry,
    cls: classes.value.find((c) => c.id === entry.classId),
    sub: subclasses.value.find((s) => s.id === entry.subclassId),
  })),
);
```

Replace `additionalKeys` and `availableSpells` with a union across all class entries:

```ts
const availableSpells = computed(() => {
  const matchOne = (s: RulesEntity<SpellData>) =>
    resolvedEntries.value.some(({ cls, sub }) =>
      cls && spellMatchesClass(
        s, cls.name, cls.source, sub, subclassAdditionalSpellKeys(sub, spells.value),
      ),
    );
  return [
    ...hbSpellsAsRules.value,
    ...spells.value.filter(matchOne),
  ];
});
```

Keep `selectedSpells`, `hbSpellsAsRules`, `visibleSpells`, `toggleSpell`, `spellLevelLabel`, `cloneDraft`, and `saveCharacter` as they are. Also delete the now-dead `classOptions` computed (its only consumer was the removed class `<select>`), drop `cantripsKnownForLevel` from the `~/utils/character` import (the new watcher doesn't use it), and remove `classes: hbClasses` from the `useHomebrew()` destructure (homebrew classes aren't offered in the multiclass picker). Keep `raceOptions`, `hbRaces`, `hbSubraces`, and `hbSpells`.

Replace the two `watch(selectedClass, ...)` and `watch(selectedSubclass, ...)` blocks with a single watcher on the classes array:

```ts
watch(
  () => JSON.stringify(draft.classes),
  () => {
    if (spells.value.length) {
      draft.selectedSpellIds = draft.selectedSpellIds.filter((spellId) =>
        availableSpells.value.some((spell) => spell.id === spellId),
      );
    }
    const primary = primaryClass.value;
    if (primary) {
      const conMod = abilityModifier(draft.abilityScores.con);
      const hitDie = primary.data.hitDie?.faces ?? 8;
      const suggestedHp = Math.max(1, hitDie + conMod);
      if (draft.maxHp === 8 && draft.currentHp === 8) {
        draft.maxHp = suggestedHp;
        draft.currentHp = suggestedHp;
      }
    }
  },
);
```

Ensure `draft.classes` starts with one empty row so the editor shows a row on load. After `const draft = reactive<CharacterDraft>(createEmptyCharacter());`, add:

```ts
if (draft.classes.length === 0) draft.classes.push({ classId: "", subclassId: "", level: 1 });
```

- [ ] **Step 3: Add minimal style for the heading spacing**

In the `<style scoped>` block of `new.vue`, add:

```css
.classes-heading { margin-top: 18px; }
```

- [ ] **Step 4: Manual verification**

Run: `npm run dev`. On `/character/new`:
- Pick a class, subclass, level; add a second class; the total-level readout updates.
- The spell list shows spells from both classes.
- Set CON and a class — Max HP auto-suggests from the primary (first) class hit die while still at the default 8/8.
- Save → redirects to the sheet. Stop the server.

- [ ] **Step 5: Commit**

```bash
git add app/pages/character/new.vue
git commit -m "feat: multiclass support on character creation page"
```

---

## Task 7: `SpellPreparationPanel` accepts a `classLevel`

**Files:**
- Modify: `app/components/SpellPreparationPanel.vue`

- [ ] **Step 1: Add the `classLevel` prop**

In the `defineProps` block, add an optional `classLevel`:

```ts
const props = defineProps<{
  character: CharacterDraft;
  spells: RulesEntity<SpellData>[];
  selectedClass?: RulesEntity<ClassData>;
  selectedSubclass?: RulesEntity<SubclassData>;
  spellcastingMod: number;
  profBonus: number;
  classLevel?: number;
}>();
```

- [ ] **Step 2: Use it wherever the panel reads the character level**

Add a helper just after `defineProps`:

```ts
const effectiveLevel = computed(() => props.classLevel ?? props.character.level ?? 1);
```

Then replace each `props.character.level` reference in the computeds with `effectiveLevel.value`:
- in `cantripsAllowed`: `prog[effectiveLevel.value - 1] ?? 0`
- in `spellsKnownAllowed`: `prog[effectiveLevel.value - 1] ?? 0`
- in `halfCasterLevel`: use `effectiveLevel.value` in both branches and the fallback `return` (i.e. `Math.floor(effectiveLevel.value / 2)`, `Math.floor(effectiveLevel.value / 3)`, `return effectiveLevel.value;`)
- in `preparedAllowed`: replace the `props.character.level` in the `lvl` expression with `effectiveLevel.value`.

- [ ] **Step 3: Manual verification**

Run: `npm run dev`. Existing single-class casters still show correct cantrip/known/prepared counts (panel defaults `classLevel` to `character.level`). Stop the server.

- [ ] **Step 4: Commit**

```bash
git add app/components/SpellPreparationPanel.vue
git commit -m "feat: SpellPreparationPanel supports per-class level override"
```

---

## Task 8: `CombatPanel` shows a per-class hit-dice label

**Files:**
- Modify: `app/components/CombatPanel.vue`

- [ ] **Step 1: Replace the `hitDieFaces` prop with `hitDiceLabel`**

In the `defineProps` block, change:

```ts
const props = defineProps<{
  character: CharacterDraft;
  hitDiceLabel: string;
  profBonus: number;
}>();
```

- [ ] **Step 2: Update the hit-dice template line**

Replace the existing hit-dice text line:

```html
        <p class="hd-text">d{{ hitDieFaces }} · {{ hdRemaining }} / {{ character.level }}</p>
```

with:

```html
        <p class="hd-text">{{ hitDiceLabel || '—' }} · {{ hdRemaining }} / {{ character.level }}</p>
```

Leave `hdRemaining`, `spendHitDie`, and everything else unchanged.

- [ ] **Step 3: Manual verification**

Deferred to Task 9 (the page must pass the new prop). For now, run `npm run dev` and expect a Vue warning about the missing `hitDiceLabel` prop on the sheet — that's expected until Task 9. Stop the server.

- [ ] **Step 4: Commit**

```bash
git add app/components/CombatPanel.vue
git commit -m "feat: CombatPanel renders per-class hit-dice label"
```

---

## Task 9: Character sheet multiclass rework

**Files:**
- Modify: `app/pages/character/[id].vue`

This is the largest task. Work through the script changes first, then the template.

- [ ] **Step 1: Add multiclass imports and a class lookup**

In the `<script setup>` imports, add the multiclass helpers:

```ts
import {
  abilities,
  abilityModifier,
  proficiencyBonus,
  signed,
} from "~/utils/character";
import {
  totalLevel,
  effectiveSpellSlots,
  pactSlots,
  hitDiceLabel,
  type ClassLookup,
} from "~/utils/multiclass";
import { SKILLS, type Skill } from "~/utils/skills";
```

(Remove `spellSlotsForLevel` from the `~/utils/character` import — it's replaced by `effectiveSpellSlots`.)

Add a lookup and resolved-entries computed near the other computeds (after `selectedRace`):

```ts
const classLookup = computed<ClassLookup>(() => {
  const map = new Map(classes.value.map((c) => [c.id, c]));
  return (cid: string) => map.get(cid);
});

const classEntries = computed(() => character.value?.classes ?? []);

const resolvedClasses = computed(() =>
  classEntries.value.map((entry) => ({
    entry,
    cls: classes.value.find((c) => c.id === entry.classId),
    sub: subclasses.value.find((s) => s.id === entry.subclassId),
  })),
);

const primaryEntry = computed(() => resolvedClasses.value[0]);
```

- [ ] **Step 2: Replace level + label + prof-bonus computeds**

Replace `selectedClass`, `selectedSubclass`, `classLabel`, `subclassLabel`, `profBonus`, and `hitDieFaces` as follows. Keep `selectedRace`/`raceLabel`.

```ts
const totalChrLevel = computed(() =>
  classEntries.value.length ? totalLevel(classEntries.value) : (character.value?.level ?? 1),
);

const classLabel = computed(() =>
  resolvedClasses.value
    .map(({ entry, cls }) => `${cls?.name ?? "—"} ${entry.level}`)
    .join(" / "),
);

const subclassLabel = computed(() =>
  resolvedClasses.value.map(({ sub }) => sub?.name).filter(Boolean).join(" · "),
);

const profBonus = computed(() => proficiencyBonus(totalChrLevel.value));

const sheetHitDiceLabel = computed(() => hitDiceLabel(classEntries.value, classLookup.value));
```

Delete the old `selectedClass`/`selectedSubclass` single-class computeds. Where other code referenced them, you'll update it in the following steps.

- [ ] **Step 3: Replace spell-slot and spellcasting computeds**

Replace the `spellSlots`, `spellcastingAbility`, `spellcastingMod`, `spellAttackBonus`, `spellSaveDc`, and `knownSpells` computeds with multiclass-aware versions:

```ts
const spellSlots = computed(() => effectiveSpellSlots(classEntries.value, classLookup.value));

const pact = computed(() => pactSlots(classEntries.value, classLookup.value));

type CasterBlock = {
  key: string;
  className: string;
  cls: NonNullable<ReturnType<typeof classes.value.find>>;
  sub: ReturnType<typeof subclasses.value.find>;
  level: number;
  ability: Ability;
  mod: number;
  saveDc: number;
  attack: number;
};

const casterBlocks = computed<CasterBlock[]>(() => {
  if (!character.value) return [];
  const out: CasterBlock[] = [];
  for (const { entry, cls, sub } of resolvedClasses.value) {
    const ability = cls?.data.spellcastingAbility ?? null;
    if (!cls || !ability) continue;
    const mod = abilityModifier(character.value.abilityScores[ability]);
    const attack = mod + profBonus.value;
    out.push({
      key: entry.classId,
      className: cls.name,
      cls,
      sub,
      level: entry.level,
      ability,
      mod,
      saveDc: attack + 8,
      attack,
    });
  }
  return out;
});

const hasCasting = computed(() => casterBlocks.value.length > 0);
```

- [ ] **Step 4: Replace per-class feature computeds**

Replace `classFeaturesByLevel` and `subclassFeaturesByLevel` (which assumed a single class) with functions over a resolved entry, plus a grouped list per class:

```ts
const groupByLevel = <T extends { data: { level: number | null } }>(features: T[]) => {
  const groups = new Map<number, T[]>();
  for (const f of features) {
    const lv = f.data.level ?? 0;
    if (!groups.has(lv)) groups.set(lv, []);
    groups.get(lv)!.push(f);
  }
  return [...groups.entries()].sort((a, b) => a[0] - b[0]).map(([level, fs]) => ({ level, features: fs }));
};

const classFeatureGroups = computed(() =>
  resolvedClasses.value
    .filter(({ cls }) => cls)
    .map(({ entry, cls }) => ({
      key: entry.classId,
      name: cls!.name,
      groups: groupByLevel(
        classFeatures.value.filter(
          (f) =>
            f.data.className === cls!.name
            && f.data.classSource === cls!.source
            && (f.data.level ?? 0) <= entry.level,
        ),
      ),
    }))
    .filter((c) => c.groups.length),
);

const subclassFeatureGroups = computed(() =>
  resolvedClasses.value
    .filter(({ cls, sub }) => cls && sub)
    .map(({ entry, cls, sub }) => ({
      key: entry.classId,
      name: sub!.name,
      groups: groupByLevel(
        subclassFeatures.value.filter(
          (f) =>
            f.data.className === cls!.name
            && f.data.classSource === cls!.source
            && f.data.subclassShortName === sub!.data.shortName
            && f.data.subclassSource === sub!.source
            && (f.data.level ?? 0) <= entry.level,
        ),
      ),
    }))
    .filter((c) => c.groups.length),
);
```

- [ ] **Step 5: Update saving throws, nav, and rest helpers**

Update `isSaveProficient` and `toggleSaveProficiency` to use the primary class:

```ts
const isSaveProficient = (ability: Ability) => {
  const explicit = character.value?.savingThrowProficiencies;
  if (explicit && explicit.length) return explicit.includes(ability);
  return primaryEntry.value?.cls?.data.savingThrowProficiencies?.includes(ability) ?? false;
};
```

In `toggleSaveProficiency`, replace `selectedClass.value?.data.savingThrowProficiencies ?? []` with `primaryEntry.value?.cls?.data.savingThrowProficiencies ?? []`.

In `navLinks`, replace `spellSaveDc.value !== null` checks with `hasCasting.value`, and replace any `resourcesAvailable.value`/`spellSlotsAvailable` logic:

```ts
const resourcesAvailable = computed(() => resolvedClasses.value.some(({ cls }) => cls));
const spellSlotsAvailable = computed(() => spellSlots.value.some((n) => n > 0) || pact.value !== null);
```

And in `navLinks`, change the two `if (spellSaveDc.value !== null)` lines to `if (hasCasting.value)`.

Keep `fullRest`, `usedSlots`, `toggleSlot`, `restoreAllSlots` unchanged.

- [ ] **Step 6: Add a classes-change handler that keeps `level` in sync**

Add this helper (used by the template editor):

```ts
const updateClasses = (next: CharacterDraft["classes"]) => {
  if (!character.value) return;
  character.value.classes = next;
  character.value.level = next.length ? totalLevel(next) : character.value.level;
};
```

- [ ] **Step 7: Template — header**

Replace the `.header-id` block's eyebrow paragraph (the one with the level `<input>`) with:

```html
        <p class="eyebrow">{{ classLabel || "No class" }} · Level {{ totalChrLevel }}</p>
```

(Removes the inline single-level input; levels are now edited via the editor added next.)

- [ ] **Step 8: Template — add the ClassesEditor panel**

Immediately after the closing tag of the `<header class="sheet-header">` ... `</header>` block (before `<ShareCharacterModal>`), insert:

```html
    <section class="panel">
      <div class="section-heading">
        <div><p class="eyebrow">Classes</p><h2>Class & levels</h2></div>
      </div>
      <ClassesEditor
        :model-value="character.classes"
        :classes="classes ?? []"
        :subclasses="subclasses ?? []"
        :ability-scores="character.abilityScores"
        @update:model-value="updateClasses"
      />
    </section>
```

- [ ] **Step 9: Template — CombatPanel prop**

Change the `CombatPanel` usage:

```html
      <CombatPanel :character="character" :hit-dice-label="sheetHitDiceLabel" :prof-bonus="profBonus" />
```

- [ ] **Step 10: Template — spellcasting summary (per class)**

Replace the single `<section id="casting" ... v-if="spellSaveDc !== null">...</section>` block with a per-caster loop:

```html
    <section id="casting" class="panel" v-if="hasCasting">
      <div class="section-heading">
        <div><p class="eyebrow">Casting</p><h2>Spellcasting</h2></div>
      </div>
      <div v-for="block in casterBlocks" :key="block.key" class="cast-class">
        <h3 class="cast-class-name">{{ block.className }}</h3>
        <dl class="cast-grid">
          <div><dt>Ability</dt><dd>{{ block.ability.toUpperCase() }}</dd></div>
          <div><dt>Save DC</dt><dd>{{ block.saveDc }}</dd></div>
          <div><dt>Attack</dt><dd>{{ signed(block.attack) }}</dd></div>
          <div><dt>Prof.</dt><dd>{{ signed(profBonus) }}</dd></div>
        </dl>
      </div>
    </section>
```

- [ ] **Step 11: Template — spell preparation (per class)**

Replace the `<div id="spells">` block's single `SpellPreparationPanel` with one per caster block:

```html
    <div id="spells">
      <SpellPreparationPanel
        v-for="block in casterBlocks"
        :key="block.key"
        :character="character"
        :spells="spells"
        :selected-class="block.cls"
        :selected-subclass="block.sub"
        :spellcasting-mod="block.mod"
        :prof-bonus="profBonus"
        :class-level="block.level"
      />
    </div>
```

- [ ] **Step 12: Template — class resources (per class)**

Replace the `<div id="resources">...</div>` block:

```html
    <div id="resources">
      <ClassResourcesPanel
        v-for="rc in resolvedClasses"
        v-if="rc.cls"
        :key="rc.entry.classId"
        :character="character"
        :class-name="rc.cls.name"
        :level="rc.entry.level"
      />
    </div>
```

- [ ] **Step 13: Template — spell slots (multiclass + pact)**

In the `<section id="slots" ...>` block, change the `v-if` to `spellSlotsAvailable` and add a pact row group after the existing `.slot-rows` div:

Change the section open tag to:

```html
    <section id="slots" class="panel" v-if="spellSlotsAvailable">
```

Then, immediately before the closing `</section>` of the slots block, add:

```html
      <div v-if="pact" class="pact-row">
        <span class="slot-label">Pact</span>
        <div class="pips">
          <button
            v-for="n in pact.count"
            :key="n"
            type="button"
            class="pip"
            :class="{ spent: n <= usedSlots(9) }"
            :aria-label="`Pact slot ${n}`"
            @click="toggleSlot(9, n)"
          ></button>
        </div>
        <span class="slot-count">Level {{ pact.level }} · {{ pact.count - usedSlots(9) }} / {{ pact.count }}</span>
      </div>
```

(Pact slots reuse the `usedSpellSlots` array at index 9, which the 1–9 leveled slots never touch.)

- [ ] **Step 14: Template — class & subclass features (per class)**

Replace the `<section id="class-features" ...>` block:

```html
    <section id="class-features" class="panel" v-if="classFeatureGroups.length">
      <div class="section-heading">
        <div><p class="eyebrow">Discipline</p><h2>Class Features</h2></div>
      </div>
      <div v-for="cf in classFeatureGroups" :key="cf.key" class="class-feature-block">
        <h3 class="feature-class-name">{{ cf.name }}</h3>
        <details v-for="group in cf.groups" :key="`cl-${cf.key}-${group.level}`" class="feature-group" open>
          <summary>
            <span class="lvl">Lv {{ group.level }}</span>
            <span class="names">{{ group.features.map((f: any) => f.name).join(" · ") }}</span>
          </summary>
          <article v-for="feature in group.features" :key="feature.id" :id="`cl-${feature.id}`" class="feature">
            <h3>{{ feature.name }}</h3>
            <RuleEntries :entries="(feature.data.entries ?? []) as any" />
          </article>
        </details>
      </div>
    </section>
```

Replace the `<section id="subclass-features" ...>` block:

```html
    <section id="subclass-features" class="panel" v-if="subclassFeatureGroups.length">
      <div class="section-heading">
        <div><p class="eyebrow">Path</p><h2>Subclass Features</h2></div>
      </div>
      <div v-for="sf in subclassFeatureGroups" :key="sf.key" class="class-feature-block">
        <h3 class="feature-class-name">{{ sf.name }}</h3>
        <details v-for="group in sf.groups" :key="`sc-${sf.key}-${group.level}`" class="feature-group" open>
          <summary>
            <span class="lvl">Lv {{ group.level }}</span>
            <span class="names">{{ group.features.map((f: any) => f.name).join(" · ") }}</span>
          </summary>
          <article v-for="feature in group.features" :key="feature.id" :id="`sc-${feature.id}`" class="feature">
            <h3>{{ feature.name }}</h3>
            <RuleEntries :entries="(feature.data.entries ?? []) as any" />
          </article>
        </details>
      </div>
    </section>
```

- [ ] **Step 15: Update `FeaturesSummary` and `CombatModal` props**

`FeaturesSummary` currently receives `class-features-by-level` / `subclass-features-by-level`. Pass the primary class's groups to preserve its summary (it expects a flat group list):

```html
    <FeaturesSummary
      :race-features="raceFeatureNames"
      :class-features-by-level="(classFeatureGroups[0]?.groups ?? []) as any"
      :subclass-features-by-level="(subclassFeatureGroups[0]?.groups ?? []) as any"
    />
```

`CombatModal` receives `:selected-class` / `:selected-subclass`. Pass the primary class (documented limitation):

```html
    <CombatModal
      :open="combatModalOpen"
      :character="character"
      :prof-bonus="profBonus"
      :selected-class="primaryEntry?.cls"
      :selected-subclass="primaryEntry?.sub"
      :spells="spells"
      @close="combatModalOpen = false"
    />
```

- [ ] **Step 16: Add styles for the new per-class headings**

In the `<style scoped>` of `[id].vue`, add:

```css
.cast-class + .cast-class { margin-top: 14px; }
.cast-class-name,
.feature-class-name {
  margin: 12px 0 6px;
  font-family: "IM Fell English SC", serif;
  letter-spacing: 0.12em;
  font-size: 0.9rem;
  color: var(--gilt);
}
.class-feature-block + .class-feature-block { margin-top: 16px; border-top: 1px solid var(--line); padding-top: 12px; }
.pact-row {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
  padding: 10px 12px;
  border: 1px solid var(--rubric-deep);
  border-radius: 4px;
  background: rgba(199, 92, 75, 0.06);
}
```

- [ ] **Step 17: Remove now-dead references**

Search the file for leftover references to the removed computeds and fix any that remain: `selectedClass`, `selectedSubclass`, `spellSaveDc`, `spellcastingAbility`, `spellcastingMod`, `spellAttackBonus`, `classFeaturesByLevel`, `subclassFeaturesByLevel`, `hitDieFaces`, `knownSpells`, `spellSlotsForLevel`.

Run: `npx vue-tsc --noEmit -p tsconfig.json`
Expected: no errors referencing those identifiers in `[id].vue`. Fix any that appear.

- [ ] **Step 18: Manual verification**

Run: `npm test` → all unit tests PASS.
Run: `npm run dev`. On an existing single-class character: sheet renders as before (one class, correct slots/features/casting). Then:
- Open the Classes editor on the sheet, add a second class (e.g. Wizard 3 + Cleric 2). Header shows "Wizard 3 / Cleric 2 · Level 5".
- Spell Slots match the multiclass table for caster level 5.
- Two spellcasting summaries and two spell panels appear (one per caster), each with its own DC.
- Class features and resources render once per class.
- Add a Warlock level → a separate "Pact" slot row appears.
- Proficiency bonus reflects total level; saving-throw proficiencies come from the first class.
Stop the server.

- [ ] **Step 19: Commit**

```bash
git add app/pages/character/[id].vue
git commit -m "feat: multiclass rendering on character sheet"
```

---

## Final verification

- [ ] **Step 1: Full test run**

Run: `npm test`
Expected: all tests PASS.

- [ ] **Step 2: Production build sanity**

Run: `npm run build`
Expected: build completes with no type/compile errors.

- [ ] **Step 3: Regression pass (manual)**

Run: `npm run dev`. Confirm a pre-existing (legacy) character still loads and edits normally, share/import still round-trips, and a brand-new single-class character behaves exactly as before. Stop the server.
