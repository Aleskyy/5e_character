<template>
  <section class="panel">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Tome</p>
        <h2>Spellbook</h2>
      </div>
      <div class="counts">
        <span>Cantrips <strong>{{ knownCantrips.length }}<span v-if="cantripsAllowed">/{{ cantripsAllowed }}</span></strong></span>
        <span>Known <strong>{{ knownNonCantrips.length }}<span v-if="spellsKnownAllowed">/{{ spellsKnownAllowed }}</span></strong></span>
        <span>Prepared <strong>{{ preparedNonCantrips.length }}<span v-if="preparedAllowed">/{{ preparedAllowed }}</span></strong></span>
      </div>
    </div>

    <div class="tabs">
      <button type="button" :class="{ active: tab === 'prepared' }" @click="tab = 'prepared'">Prepared ({{ preparedSpells.length }})</button>
      <button type="button" :class="{ active: tab === 'known' }" @click="tab = 'known'">Known ({{ knownSpells.length }})</button>
      <button type="button" :class="{ active: tab === 'browse' }" @click="tab = 'browse'">Browse ({{ availableSpells.length }})</button>
    </div>

    <div class="filters" v-if="tab === 'browse'">
      <label>Search <input v-model="search" type="search" autocomplete="off" /></label>
      <label>
        Level
        <select v-model.number="levelFilter">
          <option :value="-1">All</option>
          <option :value="0">Cantrips</option>
          <option v-for="l in 9" :key="l" :value="l">Level {{ l }}</option>
        </select>
      </label>
    </div>

    <div v-if="tab === 'prepared'">
      <ul v-if="preparedSpells.length" class="spell-rows">
        <li v-for="spell in preparedSpells" :key="spell.id" class="spell-row prepared">
          <button type="button" class="prep-toggle on" @click="togglePrepared(spell.id)" aria-label="Unprepare">●</button>
          <span class="sp-name">{{ spell.name }}</span>
          <small>{{ levelLabel(spell.data.level) }}</small>
        </li>
      </ul>
      <p v-else class="muted">Nothing prepared. Tap ○ in Known to prepare.</p>
    </div>

    <div v-else-if="tab === 'known'">
      <ul v-if="knownSpells.length" class="spell-rows">
        <li v-for="spell in knownSpells" :key="spell.id" class="spell-row" :class="{ prepared: isPrepared(spell.id) }">
          <button type="button" class="prep-toggle" :class="{ on: isPrepared(spell.id) }" @click="togglePrepared(spell.id)" :aria-label="isPrepared(spell.id) ? 'Unprepare' : 'Prepare'">{{ isPrepared(spell.id) ? "●" : "○" }}</button>
          <span class="sp-name">{{ spell.name }}</span>
          <small>{{ levelLabel(spell.data.level) }}</small>
          <button type="button" class="ghost-button x" @click="forget(spell.id)" aria-label="Forget">×</button>
        </li>
      </ul>
      <p v-else class="muted">No spells learned yet. Open Browse to add some.</p>
    </div>

    <div v-else-if="tab === 'browse'">
      <ul v-if="visibleAvailable.length" class="spell-rows">
        <li v-for="spell in visibleAvailable" :key="spell.id" class="spell-row" :class="{ known: isKnown(spell.id) }">
          <button
            type="button"
            class="learn-toggle"
            :class="{ on: isKnown(spell.id) }"
            @click="toggleKnown(spell.id)"
            :aria-label="isKnown(spell.id) ? 'Forget' : 'Learn'"
          >{{ isKnown(spell.id) ? "✓" : "+" }}</button>
          <span class="sp-name">{{ spell.name }}</span>
          <small>{{ levelLabel(spell.data.level) }} · {{ spell.source }}</small>
        </li>
      </ul>
      <p v-else class="muted">No spells match. Pick a class first or adjust filters.</p>
      <p class="muted count">Showing {{ visibleAvailable.length }} of {{ availableSpells.length }}.</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { CharacterDraft } from "~/types/character";
import type { ClassData, RulesEntity, SpellData, SubclassData } from "~/types/rules";
import { spellMatchesClass, subclassAdditionalSpellKeys } from "~/utils/spell-filter";

const props = defineProps<{
  character: CharacterDraft;
  spells: RulesEntity<SpellData>[];
  selectedClass?: RulesEntity<ClassData>;
  selectedSubclass?: RulesEntity<SubclassData>;
  spellcastingMod: number;
  profBonus: number;
}>();

const tab = ref<"prepared" | "known" | "browse">("known");
const search = ref("");
const levelFilter = ref<number>(-1);

const additionalKeys = computed(() => subclassAdditionalSpellKeys(props.selectedSubclass, props.spells));

const availableSpells = computed(() =>
  props.spells
    .filter((s) =>
      spellMatchesClass(s, props.selectedClass?.name, props.selectedClass?.source, props.selectedSubclass, additionalKeys.value),
    )
    .sort((a, b) => a.data.level - b.data.level || a.name.localeCompare(b.name)),
);

const visibleAvailable = computed(() => {
  const q = search.value.trim().toLowerCase();
  return availableSpells.value
    .filter((s) => levelFilter.value === -1 || s.data.level === levelFilter.value)
    .filter((s) => !q || s.name.toLowerCase().includes(q))
    .slice(0, 60);
});

const knownSpells = computed(() => {
  const ids = new Set(props.character.selectedSpellIds);
  return props.spells
    .filter((s) => ids.has(s.id))
    .sort((a, b) => a.data.level - b.data.level || a.name.localeCompare(b.name));
});

const knownCantrips = computed(() => knownSpells.value.filter((s) => s.data.level === 0));
const knownNonCantrips = computed(() => knownSpells.value.filter((s) => s.data.level > 0));

const preparedIds = computed(() => {
  const cantripIds = knownCantrips.value.map((s) => s.id);
  const explicit = props.character.preparedSpellIds;
  return new Set([...(explicit ?? []), ...cantripIds]);
});

const preparedSpells = computed(() => knownSpells.value.filter((s) => preparedIds.value.has(s.id)));
const preparedNonCantrips = computed(() => preparedSpells.value.filter((s) => s.data.level > 0));

const cantripsAllowed = computed(() => {
  const prog = props.selectedClass?.data.cantripProgression ?? [];
  return prog[(props.character.level ?? 1) - 1] ?? 0;
});

const spellsKnownAllowed = computed(() => {
  const prog = props.selectedClass?.data.spellsKnownProgression
    ?? props.selectedClass?.data.spellsKnownProgressionFixed
    ?? [];
  return prog[(props.character.level ?? 1) - 1] ?? 0;
});

const preparedAllowed = computed(() => {
  const formula = props.selectedClass?.data.preparedSpellsFormula;
  if (formula === "<$level$> + <$abil_int_mod$>" || formula === "<$level$> + <$abil_wis_mod$>" || formula === "<$level$> + <$abil_cha_mod$>") {
    return Math.max(1, props.character.level + props.spellcastingMod);
  }
  if (typeof formula === "string" && formula.includes("level")) {
    return Math.max(1, props.character.level + props.spellcastingMod);
  }
  return 0;
});

const isKnown = (id: string) => props.character.selectedSpellIds.includes(id);
const isPrepared = (id: string) => preparedIds.value.has(id);

const toggleKnown = (id: string) => {
  const set = new Set(props.character.selectedSpellIds);
  if (set.has(id)) set.delete(id); else set.add(id);
  props.character.selectedSpellIds = [...set];
  if (!set.has(id)) {
    const prep = new Set(props.character.preparedSpellIds ?? [...preparedIds.value]);
    prep.delete(id);
    props.character.preparedSpellIds = [...prep];
  }
};

const forget = (id: string) => toggleKnown(id);

const togglePrepared = (id: string) => {
  const prep = new Set(props.character.preparedSpellIds ?? [...preparedIds.value]);
  if (prep.has(id)) prep.delete(id); else prep.add(id);
  props.character.preparedSpellIds = [...prep];
};

const levelLabel = (lvl: number) => (lvl === 0 ? "Cantrip" : `Lv ${lvl}`);
</script>

<style scoped>
.counts {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  font-family: "IM Fell English SC", serif;
  font-size: 0.78rem;
  letter-spacing: 0.12em;
  color: var(--ink-faint);
}
.counts strong { color: var(--gilt); margin-left: 4px; font-weight: 400; }

.tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 14px;
}
.tabs button {
  flex: 1;
  min-height: 38px;
  font-size: 0.82rem;
  background: transparent;
  border-color: var(--line);
  color: var(--ink-soft);
}
.tabs button.active { background: var(--bg-panel-2); border-color: var(--gilt); color: var(--gilt); }

.filters {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 10px;
  margin-bottom: 14px;
}

.spell-rows {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 6px;
  max-height: 480px;
  overflow-y: auto;
}

.spell-row {
  display: grid;
  grid-template-columns: 32px 1fr auto auto;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border: 1px solid var(--line);
  border-radius: 4px;
  background: var(--bg-soft);
  font-family: "EB Garamond", serif;
}
.spell-row.prepared { border-color: var(--gilt-soft); background: rgba(201, 161, 85, 0.06); }
.spell-row.known { border-color: var(--moss); }

.sp-name { font-size: 1rem; }
.spell-row small { color: var(--ink-faint); font-style: italic; font-size: 0.86rem; }

.prep-toggle, .learn-toggle {
  width: 26px; height: 26px; min-height: auto; padding: 0;
  border-radius: 50%; background: transparent; border-color: var(--line);
  color: var(--ink-faint);
}
.prep-toggle.on { color: var(--gilt); border-color: var(--gilt); background: rgba(201, 161, 85, 0.1); }
.learn-toggle.on { color: var(--moss); border-color: var(--moss); }

.x { width: 26px; height: 26px; min-height: auto; padding: 0; }

.count { margin-top: 8px; text-align: center; font-size: 0.86rem; }
</style>
