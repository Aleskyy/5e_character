<template>
  <section class="panel">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Aptitudes</p>
        <h2>Fighting Styles</h2>
      </div>
      <span v-if="selected.length" class="fs-count">{{ selected.length }}</span>
    </div>

    <div class="fs-picker">
      <select class="fs-select" :value="''" @change="add(($event.target as HTMLSelectElement).value)">
        <option value="">Add a Fighting Style…</option>
        <option v-for="s in available" :key="s.id" :value="s.id">{{ s.name }}</option>
      </select>
    </div>

    <ul v-if="selected.length" class="fs-list">
      <li v-for="s in selected" :key="s.id" class="fs-item">
        <span class="fs-name">{{ s.name }}</span>
        <small class="fs-src">{{ s.data.classes.join(", ") }}</small>
        <button type="button" class="fs-remove" :aria-label="`Remove ${s.name}`" @click="remove(s.id)">×</button>
      </li>
    </ul>
    <p v-else class="muted">No fighting style chosen yet.</p>
  </section>
</template>

<script setup lang="ts">
import type { CharacterDraft } from "~/types/character";
import type { FightingStyleData, RulesEntity } from "~/types/rules";

const props = defineProps<{
  character: CharacterDraft;
  /** Fighting styles available to this character (already filtered by class). */
  options: RulesEntity<FightingStyleData>[];
}>();

const styleIds = computed(() => props.character.fightingStyleIds ?? []);

const selected = computed(() =>
  styleIds.value
    .map((id) => props.options.find((s) => s.id === id))
    .filter((s): s is RulesEntity<FightingStyleData> => !!s),
);

const available = computed(() => props.options.filter((s) => !styleIds.value.includes(s.id)));

const add = (id: string) => {
  if (!id || styleIds.value.includes(id)) return;
  props.character.fightingStyleIds = [...styleIds.value, id];
};

const remove = (id: string) => {
  props.character.fightingStyleIds = styleIds.value.filter((x) => x !== id);
};
</script>

<style scoped>
.fs-count {
  font-family: "IM Fell English SC", serif;
  color: var(--gilt);
}

.fs-picker { margin-bottom: 12px; }

.fs-select {
  width: 100%;
  min-height: 38px;
  padding: 6px 10px;
  border: 1px solid var(--line);
  border-radius: 4px;
  background: var(--bg-soft);
  font-family: "EB Garamond", serif;
  font-size: 0.95rem;
  color: var(--ink);
}
.fs-select:focus { outline: none; border-color: var(--gilt); }

.fs-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 6px;
}
.fs-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border: 1px solid var(--gilt-soft);
  border-radius: 4px;
  background: rgba(201, 161, 85, 0.08);
}
.fs-name { font-weight: 600; }
.fs-src { color: var(--ink-faint); font-style: italic; }
.fs-remove {
  margin-left: auto;
  width: 22px;
  height: 22px;
  min-height: auto;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--ink-faint);
  font-size: 1.1rem;
  line-height: 1;
  cursor: pointer;
}
.fs-remove:hover { color: var(--rubric); }
</style>
