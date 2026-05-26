# Multiclassing — Design

**Date:** 2026-05-26
**Status:** Approved (pending spec review)

## Goal

Let a character hold more than one class, each with its own level and subclass, on both the character-creation page (`app/pages/character/new.vue`) and the character sheet (`app/pages/character/[id].vue`). Spell slots follow 5e RAW multiclass rules. Non-slot rules are lightly enforced: mechanical things are automated, ability-score prerequisites warn but never block, and proficiency grants stay manually editable.

## Background — current single-class model

`CharacterDraft` (`app/types/character.ts`) hard-codes one class via scalar fields: `classId`, `subclassId`, and a single top-level `level`. Roughly eight places derive everything from those scalars:

- `[id].vue`: `profBonus` (from `level`), `selectedClass`/`selectedSubclass`, `spellSlots`, `spellcastingAbility/Mod`, `spellSaveDc`, `classFeaturesByLevel`, `subclassFeaturesByLevel`, `isSaveProficient`.
- `ClassResourcesPanel` (props `class-name`, `level`).
- `SpellPreparationPanel` (props `selected-class`, `selected-subclass`, `spellcasting-mod`, `prof-bonus`).
- `CombatPanel` (prop `hit-die-faces`).
- `CombatModal` (props `selected-class`, `selected-subclass`).
- `useCharacters.normalizeCharacter` (backfills fields onto saved data).

Rules data (`public/data/*.json`) is read-only and already keyed by class **name + source**; `spellMatchesClass` / `subclassAdditionalSpellKeys` (`app/utils/spell-filter.ts`) filter spells per class. Saved user data lives in `localStorage`; share codes (`app/utils/share-code.ts`) serialize the whole draft.

## 1. Data model

Add a per-class entry; make a list the source of truth.

```ts
export type ClassEntry = {
  classId: string;
  subclassId: string;
  level: number; // 1..20
};
// CharacterDraft gains:
classes: ClassEntry[]; // classes[0] = primary (grants saving throws + base HP)
```

Rules:

- `classes[0]` is the **primary** class: source of saving-throw proficiencies and the base hit die for HP suggestions.
- Legacy `classId` / `subclassId` / `level` remain on the type but become **migration/compat only**.
- `level` is kept in sync as the **derived total** (`sum of entry levels`) whenever the character is normalized/saved, so any code or external share-importer still reading `character.level` stays correct. Proficiency bonus is computed from this total.
- Constraints: no duplicate `classId`; each entry level 1–20; total level capped at 20.

### Migration

`normalizeCharacter` (`useCharacters.ts`) gains a step:

- If `classes` is absent or empty **and** a legacy `classId` exists → set `classes = [{ classId, subclassId: subclassId ?? "", level: level ?? 1 }]`.
- If `classes` is absent and no legacy `classId` → `classes = []`.
- Always recompute `level = totalLevel(classes)` (falling back to existing `level` when `classes` is empty, so a class-less draft keeps its manual level).
- Idempotent: running twice yields the same result.

The same `normalizeCharacter` runs on share-code import, so old share codes migrate too.

## 2. New util `app/utils/multiclass.ts`

Pure functions (no Vue), unit-tested:

- `totalLevel(classes: ClassEntry[]): number` — sum of entry levels.
- `casterLevel(classes, classLookup): number` — combined caster level for the shared multiclass slot table:
  - Full casters (Bard, Cleric, Druid, Sorcerer, Wizard; `casterProgression === "full"`) add their full level.
  - Half casters (Paladin, Ranger; `casterProgression === "1/2"`) add `floor(level / 2)`.
  - Third casters (`casterProgression === "1/3"`, e.g. Eldritch Knight / Arcane Trickster subclasses) add `floor(level / 3)`.
  - **Artificer** is treated as a half caster but rounds **up** (`ceil(level / 2)`), per its rules text.
  - **Warlock is excluded** — pact magic is tracked separately.
  - Detection uses each class's `data.casterProgression` from `classes.json`; classes with `null` progression contribute 0.
- `MULTICLASS_SLOT_TABLE: number[][]` — the fixed 20-row multiclass spellcaster slot table (index = caster level − 1, value = `[L1..L9]` slot counts).
- `multiclassSpellSlots(casterLevel: number): number[]` — table lookup, clamped to 1–20.
- `effectiveSpellSlots(character, classLookup): number[]` — **fast path**: if exactly **one** spellcasting class (excluding Warlock), use that class's own native `data.spellSlotProgression[level-1]`; if two or more, use `multiclassSpellSlots(casterLevel(...))`.
- `pactSlots(character, classLookup): { count: number; level: number } | null` — Warlock pact-magic slots derived from the Warlock entry's level via its native progression, shown as a separate track.

The third-caster contribution requires knowing the subclass (only certain subclasses cast). For light enforcement we detect third-casting from the **subclass** data when available; if subclass data lacks a progression marker, that entry contributes 0 (documented limitation — user can still hand-edit slots).

## 3. Shared `<ClassesEditor>` component

`app/components/ClassesEditor.vue`, reused by `new.vue` and `[id].vue` (DRY). Props: `model-value: ClassEntry[]` plus the loaded `classes` and `subclasses` rules lists — the component **receives them as props** so the parent owns fetching (one fetch per page). Emits `update:modelValue`.

Renders:

- One row per entry: class `<select>`, subclass `<select>` (filtered to that class), level `<input number>`, and a remove button.
- "Add class" button (disabled when total level is 20 or all classes chosen). New rows default level 1.
- Live total-level readout.
- A **non-blocking** ability-prerequisite warning line per entry when the relevant ability score is below the 5e minimum (e.g. "Warlock typically requires CHA 13"). Purely advisory.

Immutability: every change emits a new array (spread), never mutates the incoming prop.

## 4. Creation page (`new.vue`) changes

- Replace the single Class/Subclass `<select>` pair and the standalone Level input with `<ClassesEditor v-model="draft.classes">`.
- HP suggestion uses `classes[0]`'s hit die (same heuristic as today, keyed off the primary class).
- Spell browse/filter: `availableSpells` becomes the union of spells matching **any** class entry (loop entries through existing `spellMatchesClass` + `subclassAdditionalSpellKeys`).
- On save, `normalizeCharacter` recomputes `level`.

## 5. Sheet page (`[id].vue`) changes

- Header label: join entries as `"Wizard 3 / Cleric 2"` + `· Level {{ totalLevel }}`.
- Replace the inline level `<input>` with a `<ClassesEditor>` (in an existing-style panel near the top) so levels/classes/subclasses are editable on the sheet.
- `profBonus` ← `proficiencyBonus(totalLevel)`.
- `isSaveProficient` ← reads **`classes[0]`** class's saving throws (with the same manual-override fallback already present).
- **Class features**, **subclass features**, and **`ClassResourcesPanel`**: render once per class entry, each scoped to that entry's class/subclass/level. `classFeaturesByLevel` / `subclassFeaturesByLevel` become functions of a `ClassEntry`.
- **Spellcasting**: one spellcasting summary block **and** one `SpellPreparationPanel` per **spellcasting** class entry, each with its own ability mod, save DC, attack bonus, and prepared/known limits (computed from that entry's level). Per-class spell lists already filter via `spellMatchesClass`.
- **Spell Slots** section: driven by `effectiveSpellSlots(...)`. Warlock pact slots rendered as a separate labelled row group via `pactSlots(...)`.
- **`CombatPanel`**: receives the class entries (or a derived `hitDice: {faces, count}[]`) and lists hit dice per class instead of a single `hit-die-faces`.

## 6. Scope boundaries (YAGNI / known limitations)

- Ability prerequisites **warn**, never block.
- Proficiency grants stay manually editable (no auto multiclass-proficiency parsing).
- HP stays manual; we only display per-class hit dice.
- `CombatModal` recap scopes spell DC/attack to the **primary spellcasting class** for now (not fully multiclass-aware); documented, not reworked.
- `selectedSpellIds` / `preparedSpellIds` remain global arrays shared across classes; per-class panels filter them by class. A spell on two class lists can appear in both panels (acceptable).
- Third-caster slot contribution depends on subclass data being present; missing data → 0 contribution, user can hand-edit.

## 7. Testing

No test runner exists today. Add **Vitest** (dev dependency) with an `npm test` script. Unit tests cover:

- `multiclass.ts`: `totalLevel`, `casterLevel` (full/half/third/Artificer/Warlock-excluded), `MULTICLASS_SLOT_TABLE` spot values, `multiclassSpellSlots`, single-vs-multi fast path in `effectiveSpellSlots`, `pactSlots`.
- `normalizeCharacter` migration: legacy scalars → `classes[]`, idempotency, class-less draft keeps manual level.

UI wiring (both pages, per-class panels, slots) verified manually via `npm run dev`.

## Affected files

- `app/types/character.ts` — add `ClassEntry`, `classes`.
- `app/utils/character.ts` — `totalLevel` helper / HP from primary class (or re-export from multiclass util).
- `app/utils/multiclass.ts` — **new**.
- `app/composables/useCharacters.ts` — migration in `normalizeCharacter`.
- `app/components/ClassesEditor.vue` — **new**.
- `app/pages/character/new.vue` — use `ClassesEditor`, union spell filter.
- `app/pages/character/[id].vue` — per-class rendering, multiclass slots, header, prof/saves.
- `app/components/ClassResourcesPanel.vue`, `SpellPreparationPanel.vue`, `CombatPanel.vue` — accept per-class scoping (mostly already prop-driven).
- `package.json` — Vitest + `test` script; `vitest.config.ts` — **new**.
- Test files under `test/` or co-located `*.test.ts`.
