# 5e Character PWA Plan

## Goal

Build a mobile-first Nuxt PWA for creating, editing, and using full interactive D&D 5e character sheets offline. The app will use the local 5e.tools JSON data as its rules source, starting with classes, races/species, and spells. Items, full inventory automation, and deeper homebrew tooling can come later, but the architecture should leave room for them.

## Current Workspace

- Raw source data exists in `5etools-v2.28.0/`.
- Important data locations:
  - `5etools-v2.28.0/data/class/index.json`
  - `5etools-v2.28.0/data/class/class-*.json`
  - `5etools-v2.28.0/data/races.json`
  - `5etools-v2.28.0/data/spells/index.json`
  - `5etools-v2.28.0/data/spells/spells-*.json`
- The Nuxt app still needs to be scaffolded.

## Product Scope

### Version 1 Focus

- Character library with multiple local characters.
- Guided character creation.
- Free-edit character sheet mode.
- Interactive sheet calculations.
- Spell selection and spell slot tracking.
- Local/offline storage.
- PWA installation and offline use.

### Later Scope

- Items and equipment automation.
- Backgrounds.
- Feats.
- Homebrew import UI.
- Cloud sync or accounts, if ever wanted.
- Character portraits and richer customization.

## Technical Direction

### Framework

- Nuxt.
- Mobile-first responsive UI.
- PWA support with offline caching.
- IndexedDB for local character storage.

### Suggested Libraries

- `@vite-pwa/nuxt` for PWA support.
- `dexie` for IndexedDB storage.
- Pinia or Nuxt composables for app state.
- Zod or Valibot for validating normalized data and saved characters.

## Data Strategy

Do not make the app consume the raw 5e.tools JSON directly at runtime. Instead, create a build-time normalization pipeline that converts the raw files into stable app-owned data files.

Suggested output:

```txt
public/data/
  classes.json
  subclasses.json
  classFeatures.json
  races.json
  spells.json
  spellLists.json
  sources.json
```

The app should use stable internal IDs:

```txt
class:phb:wizard
race:phb:elf
spell:phb:fireball
subclass:phb:evocation
```

This lets core data and future homebrew data share the same lookup system.

## Data Entities

All rules entities should have a shared wrapper shape:

```ts
type RulesEntity<T> = {
  id: string
  kind: "class" | "subclass" | "classFeature" | "race" | "spell" | "background" | "feat" | "item"
  name: string
  source: string
  sourceType: "core" | "homebrew"
  data: T
}
```

This keeps the door open for homebrew without focusing on it immediately.

## Character Model

Saved characters should store user choices, current state, and explicit overrides. They should not copy entire class/race/spell definitions into each character.

Draft shape:

```ts
type Character = {
  id: string
  version: number
  name: string
  level: number
  ancestry: EntityRef | null
  classes: CharacterClassLevel[]
  abilityScores: Record<Ability, number>
  proficiencies: ProficiencyState
  spells: CharacterSpellState
  resources: CharacterResourceState
  currency: CurrencyState
  overrides: CharacterOverrides
  notes: string
  createdAt: string
  updatedAt: string
}
```

Derived values should be computed from the character save plus normalized rules data:

- Proficiency bonus.
- Ability modifiers.
- Saving throw bonuses.
- Skill bonuses.
- Passive perception.
- Armor class, with manual override support.
- Initiative.
- Speed.
- Hit points.
- Hit dice.
- Spell save DC.
- Spell attack bonus.
- Spell slots.
- Known/prepared spells.
- Class features by level.
- Race/species traits.

## App Sections

### Character Library

- List local characters.
- Create a character.
- Duplicate a character.
- Rename a character.
- Delete a character.
- Export character JSON.
- Import character JSON.

### Guided Builder

Recommended steps:

1. Identity: name and basic details.
2. Race/species selection.
3. Class selection.
4. Subclass selection when applicable.
5. Ability scores.
6. Proficiencies.
7. Spell choices, if applicable.
8. Review and open sheet.

The guided builder should write to the same character model used by free-edit mode.

### Free Edit Mode

- Directly edit the character sheet.
- Allow manual overrides for calculated fields.
- Make overrides visible and reversible.
- Support table-specific exceptions without fighting the user.

### Interactive Character Sheet

Mobile-first tabs:

- Overview.
- Stats.
- Skills.
- Attacks.
- Spells.
- Features.
- Inventory, later.
- Notes.

Core interactions:

- Level changes update proficiency and features.
- Ability score changes update all dependent values.
- HP can be adjusted during play.
- Hit dice can be spent/restored.
- Death saves can be marked/reset.
- Spell slots can be spent/restored.
- Prepared/known spells can be selected.
- Gold can be edited.

## Spell System

Spell browsing and selection should support:

- Filter by class.
- Filter by spell level.
- Filter by source.
- Filter by school.
- Filter by ritual.
- Filter by concentration.
- Search by name.
- Spell detail view.
- Known spells.
- Prepared spells.
- Cantrips.
- Spell slot tracking.
- Pact magic for warlocks.

Spellcasting logic should account for:

- Full casters.
- Half casters.
- Third casters later, if subclasses/items require it.
- Prepared casters.
- Known casters.
- Pact magic.
- Multiclass spell slot progression later.

## Offline/PWA Requirements

- App shell works offline.
- Normalized rules data is cached offline.
- Characters are stored in IndexedDB.
- User can export/import character JSON as backup.
- App has a manifest and installable icons.
- Offline state should be visible but unobtrusive.
- The app should remain usable after first successful load without network access.

## Homebrew Considerations

Do not build full homebrew editing in v1, but design for it:

- Rules entities include `sourceType`.
- IDs include source.
- Normalized data loader can merge multiple source collections.
- Character saves reference entities by ID.
- Missing entity references should be handled gracefully.
- Later homebrew can be imported as a separate collection.

## Build Phases

### Phase 1: Nuxt Foundation

- Scaffold Nuxt app.
- Add PWA support.
- Add storage dependency.
- Create base mobile layout.
- Create navigation structure.

### Phase 2: Data Normalization

- Write scripts to read the local 5e.tools JSON.
- Normalize classes.
- Normalize subclasses.
- Normalize class features.
- Normalize races/species.
- Normalize spells.
- Generate `public/data/*.json`.
- Add simple data validation.
- Add internal debug/browse pages to inspect loaded data.

### Phase 3: Character Storage

- Define character TypeScript types.
- Create IndexedDB schema.
- Implement create/read/update/delete.
- Implement export/import character JSON.
- Add basic migration/version handling.

### Phase 4: Rules Calculation Engine

- Calculate ability modifiers.
- Calculate proficiency bonus.
- Calculate skills and saves.
- Calculate class level totals.
- Calculate HP and hit dice.
- Calculate class features by level.
- Calculate race/species traits.
- Calculate spellcasting stats.
- Calculate spell slots.

### Phase 5: Interactive Sheet

- Build character sheet tabs.
- Connect live calculations.
- Add editable current state fields.
- Add override support.
- Add spell slot tracker.
- Add prepared/known spell picker.

### Phase 6: Guided Builder

- Build step-by-step creation flow.
- Reuse same character model and calculation engine.
- Add validation for required choices.
- Allow switching from guided builder to free edit.

### Phase 7: Offline Polish

- Configure service worker caching.
- Pre-cache normalized rules data.
- Confirm offline startup.
- Add offline indicator.
- Test on mobile viewport.

### Phase 8: Expansion

- Backgrounds.
- Feats.
- Items and equipment.
- Attacks and inventory automation.
- Homebrew import.
- Better multiclass support.
- Character sheet print/export.

## Risks And Decisions

- The raw 5e.tools data is rich and irregular, so normalization should be built incrementally.
- Some class/race features are descriptive text, not directly machine-actionable rules.
- Manual overrides are required because full 5e automation has many edge cases.
- Spellcasting should be implemented carefully, especially prepared casters, warlock pact magic, and future multiclassing.
- Items are intentionally delayed to avoid turning v1 into a full inventory and equipment rules engine.

## Recommended Next Step

Scaffold the Nuxt app, then build the data normalization pipeline for classes, races/species, and spells. Once the normalized data is loading cleanly inside Nuxt, the character model and interactive sheet can be developed against stable app-owned data instead of wrestling the raw source files in every component.
