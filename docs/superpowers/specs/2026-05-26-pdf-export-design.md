# Export to Official 5e Character Sheet PDF — Design

**Date:** 2026-05-26
**Status:** Approved (pending spec review)

## Goal

Add a one-click "Export PDF" button on the character sheet that fills the official D&D 5e fillable character sheet PDF with the character's current data and downloads it. Fully client-side (the app is an SSR-disabled SPA). All 3 pages filled. Multiclass-aware where the sheet allows.

## Decisions (from brainstorming)

- **Template:** bundle the official WotC fillable sheet, already present at `public/template/5E_CharacterSheet_Fillable.pdf` (334 AcroForm fields, confirmed via `pdf-lib`).
- **Scope:** all 3 pages.
- **UX:** one-click download from current data, button in the sheet header next to Share/Delete. Output is **flattened** (form fields rendered, not editable).
- **Spell page header:** uses the **primary spellcasting class** (the sheet has only one spellcasting block).
- **Attacks:** from **equipped weapons in inventory** (same source as `AttacksPanel`).

### Licensing caveat (recorded, non-blocking per owner's choice)

The bundled PDF is WotC copyrighted material; redistributing it on a public site is a legal gray area. The fill logic is identical for a user-supplied PDF, so switching to "user uploads their own sheet" later is a small change isolated to how template bytes are obtained.

## Architecture

```
[id].vue "Export PDF" button
   → gather character + rules context (classes, subclasses, spells, item library)
   → exportCharacterPdf(character, ctx): Promise<Uint8Array>
        → fetch /template/5E_CharacterSheet_Fillable.pdf  (bytes)
        → PDFDocument.load(bytes); form = doc.getForm()
        → apply field map via safe setters (skip missing fields)
        → form.flatten(); doc.save() → Uint8Array
   → download via Blob + object URL (existing pattern in [id].vue)
```

`pdf-lib` is a **runtime dependency** (used in the browser) → it must live in `package.json` `dependencies` (not devDependencies).

## Components / files

### `app/utils/pdf-field-names.ts` (constants)
Baked field-name maps for the *specific bundled PDF*, produced once by the discovery script (below) and hand-verified:
- `SKILL_CHECKBOX: Record<skillKey, string>` — skill → proficiency checkbox field name.
- `SAVE_CHECKBOX: Record<Ability, string>` — saving throw → proficiency checkbox field name.
- `SKILL_FIELD: Record<skillKey, string>` — skill → total text field name (e.g. `Acrobatics`, `Animal`, `Deception ` with its exact trailing space).
- `SAVE_FIELD: Record<Ability, string>` — e.g. `ST Strength`.
- `ABILITY_SCORE_FIELD` / `ABILITY_MOD_FIELD: Record<Ability, string>` — `STR`/`STRmod`, `DEX`/`DEXmod `, etc. (note inconsistent trailing spaces in the real file — use exact strings).
- `SPELL_ROWS_BY_LEVEL: Record<0..9, string[]>` — ordered `Spells 10NN` field names per spell level block (cantrips = level 0).
- `SLOT_FIELDS_BY_LEVEL: Record<1..9, { total: string; remaining: string }>` — `SlotsTotal 19..27` / `SlotsRemaining 19..27`.
- `WEAPON_ROWS: { name; atk; damage }[]` (3 rows), and scalar names: `CharacterName`, `ClassLevel`, `Race `, `Background`, `Alignment`, `XP`, `Inspiration`, `ProfBonus`, `AC`, `Initiative`, `Speed`, `HPMax`, `HPCurrent`, `HPTemp`, `HDTotal`, `HD`, `Passive`, `AttacksSpellcasting`, `ProficienciesLang`, `Equipment`, `Features and Traits`, currency `CP/SP/EP/GP/PP`, page-2 (`CharacterName 2`, `Age`, `Height`, `Weight`, `Eyes`, `Skin`, `Hair`, `PersonalityTraits `, `Ideals`, `Bonds`, `Flaws`, `Allies`, `Backstory`, `Treasure`, `Feat+Traits`), page-3 (`Spellcasting Class 2`, `SpellcastingAbility 2`, `SpellSaveDC  2`, `SpellAtkBonus 2`).

### `app/utils/pdf-field-map.ts` (pure value computation — the testable core)
`buildFieldValues(character, ctx): { text: Record<string,string>; checks: Record<string,boolean> }` where `ctx` carries resolved rules + derived helpers. Pure: given inputs, returns the exact strings/booleans to write. No pdf-lib. Reuses existing utils: `abilityModifier`, `proficiencyBonus`, `signed`, multiclass `totalLevel`/`effectiveSpellSlots`/`pactSlots`/`casterLevel`, `SKILLS`, and the extracted save/skill/AC helpers (below).

### `app/utils/character-stats.ts` (small DRY extraction)
Pure helpers currently inlined in `[id].vue`, extracted so the sheet and the PDF compute identically:
- `skillBonus(character, skill, profBonus)`, `isSkillProficient`, `isSkillExpert`
- `saveBonus(character, ability, profBonus, primaryClass)`, `isSaveProficient`
- `defaultArmorClass(character, itemLib)` and `equippedAcBonus`
- `passiveScore(character, skillKey, profBonus)`
`[id].vue` and `CombatPanel.vue` are refactored to call these (no behavior change). This is targeted; no unrelated refactoring.

### `app/utils/pdf-export.ts` (orchestrator)
- `exportCharacterPdf(character, ctx): Promise<Uint8Array>` — fetches the template, loads with `pdf-lib`, calls `buildFieldValues`, writes via **safe setters**:
  - `setText(form, name, value)`: `form.getTextField(name)` guarded by existence check; ignore if absent or on error.
  - `setCheck(form, name, on)`: likewise with `getCheckBox`; `.check()`/`.uncheck()`.
- Flattens (`form.flatten()`), returns `doc.save()`.
- `downloadCharacterPdf(character, ctx)`: calls the above, wraps bytes in a Blob, triggers download named `<character name>.pdf`.

### `scripts/discover-pdf-fields.mjs` (dev/one-time, committed)
Extends the existing `scripts/dump-pdf-fields.mjs`. Loads the PDF, reads each widget's page index + rectangle, and:
- Emits, per page-1 row band (Y position), which `Check Box NN` aligns with which named skill/save text field → produces `SKILL_CHECKBOX` / `SAVE_CHECKBOX`.
- Emits the page-3 ordering of `Spells 10NN` grouped into level blocks and the `SlotsTotal/Remaining` per level → `SPELL_ROWS_BY_LEVEL`, `SLOT_FIELDS_BY_LEVEL`.
Output is hand-verified against the printed sheet and pasted into `pdf-field-names.ts`. Not run at app runtime.

## Data → field mapping details

- **Class/level:** `ClassLevel` = multiclass label "Wizard 3 / Cleric 2" (reuse the sheet's label logic).
- **Abilities:** score + `signed(mod)` into score/mod fields.
- **Saves:** total `signed(saveBonus)`, checkbox on when proficient (proficiency from `classes[0]` or explicit overrides).
- **Skills:** total `signed(skillBonus)`, checkbox on when proficient/expert (expertise still just checks the box; the sheet has no expertise marker).
- **Passive:** `passiveScore(perception)`.
- **Combat:** `AC` (explicit or default), `Initiative` (explicit or DEX mod), `Speed`, `HPMax/Current/Temp`, `HDTotal` = `"<total level>d<mixed>"` via `hitDiceLabel`, `ProfBonus` = `signed`.
- **Attacks:** up to 3 equipped weapons → name / atk bonus / damage (from item library fields). Overflow beyond 3 dropped.
- **Proficiencies & languages:** join `languages`, `toolProficiencies`, `weaponProficiencies`, `armorProficiencies`, `weaponMasteries` into `ProficienciesLang`.
- **Equipment:** inventory item names × quantity into `Equipment`.
- **Features & Traits:** class/subclass/race feature names (names only) into `Features and Traits` / `Feat+Traits`.
- **Currency:** cp/sp/gp/pp → `CP/SP/GP/PP` (`EP` left blank).
- **Page 2:** `PersonalityTraits `/`Ideals`/`Bonds`/`Flaws` from `background`. `CharacterName 2` = character name. Age/Height/Weight/Eyes/Skin/Hair left blank (we don't store these). `background.appearance` and `background.backstory` are concatenated into the `Backstory` field (appearance first, blank line, then backstory). `relations` → `Allies` as "Name — race — status" lines. `Treasure` left blank (no corresponding data). `FactionName`/faction image left blank.
- **Page 3 (only if a spellcasting class exists):** header from primary caster (`Spellcasting Class 2` = class name, ability, `SpellSaveDC  2`, `SpellAtkBonus 2`). Slots: `effectiveSpellSlots` → `SlotsTotal N`; remaining = total − used. Spells: prepared+known across classes, grouped by level, written into `SPELL_ROWS_BY_LEVEL[level]` **up to the available rows; overflow truncated** (documented limitation). Warlock pact slots are not separately representable on this sheet → folded into the matching slot level.

## Error handling

- Template fetch failure → surface a user-facing error (reuse existing alert/confirm pattern or a simple message) and abort; no partial download.
- Safe setters never throw on missing/renamed fields — they skip. So a different PDF version degrades gracefully (fewer fields filled) rather than crashing.
- No spellcasting class → page-3 header/slots/spells left blank.

## Testing

- **Vitest unit tests** on `pdf-field-map.ts` `buildFieldValues` and on `character-stats.ts`:
  - ability mod strings, save/skill totals + checkbox booleans, AC default, passive, multiclass `ClassLevel` label, currency, slot totals per level, spell grouping/truncation, no-caster → empty page-3 values.
- `pdf-export.ts` (binary fill) verified **manually**: export a sample multiclass caster and a martial character, open the PDFs, confirm placement.
- Existing 19 tests must stay green.

## Affected / new files

- New: `app/utils/pdf-field-names.ts`, `app/utils/pdf-field-map.ts`, `app/utils/pdf-export.ts`, `app/utils/character-stats.ts`, `scripts/discover-pdf-fields.mjs`, tests under `test/`.
- Modify: `app/pages/character/[id].vue` (button + handler; use `character-stats` helpers), `app/components/CombatPanel.vue` (use `character-stats` for AC/passive — no behavior change), `package.json` (move `pdf-lib` to `dependencies`).
- Asset: `public/template/5E_CharacterSheet_Fillable.pdf` (already committed by owner / to be committed).
- Existing `scripts/dump-pdf-fields.mjs` retained or superseded by `discover-pdf-fields.mjs`.
