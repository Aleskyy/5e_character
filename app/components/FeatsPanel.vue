<template>
  <section class="panel">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Aptitudes</p>
        <h2>Feats</h2>
      </div>
      <span v-if="selected.length" class="feat-count">{{ selected.length }}</span>
    </div>

    <div class="feat-picker">
      <input
        v-model="search"
        type="search"
        autocomplete="off"
        placeholder="Search feats…"
        class="feat-search"
      />
      <select class="feat-select" :value="''" @change="add(($event.target as HTMLSelectElement).value)">
        <option value="">Add a Feat…</option>
        <option v-for="f in available" :key="f.id" :value="f.id">{{ f.name }} ({{ f.source }})</option>
      </select>
    </div>

    <ul v-if="selected.length" class="feat-list">
      <li v-for="f in selected" :key="f.id" class="feat-item">
        <span class="feat-name">{{ f.name }}</span>
        <small class="feat-src">{{ f.source }}</small>
        <button type="button" class="feat-remove" :aria-label="`Remove ${f.name}`" @click="remove(f.id)">×</button>
      </li>
    </ul>
    <p v-else class="muted">No feats yet. Pick one up on level up.</p>
  </section>
</template>

<script setup lang="ts">
import type { CharacterDraft } from "~/types/character";
import type { FeatData, RulesEntity } from "~/types/rules";

const props = defineProps<{
  character: CharacterDraft;
  feats: RulesEntity<FeatData>[];
}>();

const search = ref("");

const featIds = computed(() => props.character.featIds ?? []);

const selected = computed(() =>
  featIds.value
    .map((id) => props.feats.find((f) => f.id === id))
    .filter((f): f is RulesEntity<FeatData> => !!f),
);

const available = computed(() => {
  const q = search.value.trim().toLowerCase();
  return props.feats.filter(
    (f) => !featIds.value.includes(f.id) && (!q || f.name.toLowerCase().includes(q)),
  );
});

const add = (id: string) => {
  if (!id || featIds.value.includes(id)) return;
  props.character.featIds = [...featIds.value, id];
};

const remove = (id: string) => {
  props.character.featIds = featIds.value.filter((x) => x !== id);
};
</script>

<style scoped>
.feat-count {
  font-family: "IM Fell English SC", serif;
  color: var(--gilt);
}

.feat-picker {
  display: grid;
  gap: 8px;
  margin-bottom: 12px;
}
@media (min-width: 520px) { .feat-picker { grid-template-columns: 1fr 1fr; } }

.feat-search,
.feat-select {
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
.feat-search:focus,
.feat-select:focus { outline: none; border-color: var(--gilt); }

.feat-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 6px;
}
.feat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border: 1px solid var(--gilt-soft);
  border-radius: 4px;
  background: rgba(201, 161, 85, 0.08);
}
.feat-name { font-weight: 600; }
.feat-src { color: var(--ink-faint); font-style: italic; }
.feat-remove {
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
.feat-remove:hover { color: var(--rubric); }
</style>
