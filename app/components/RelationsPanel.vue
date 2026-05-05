<template>
  <section class="panel">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Bonds &amp; Foes</p>
        <h2>Relations</h2>
      </div>
      <button type="button" class="ghost-button" @click="add">+ Add</button>
    </div>

    <p v-if="!relations.length" class="muted">No NPCs tracked yet.</p>

    <ul class="rel-list">
      <li v-for="rel in relations" :key="rel.id" class="rel-item">
        <div class="rel-grid">
          <label>Name <input v-model="rel.name" type="text" /></label>
          <label>Race <input v-model="rel.race" type="text" /></label>
          <label>
            Status
            <select v-model="rel.status">
              <option v-for="s in RELATION_STATUSES" :key="s" :value="s">{{ s }}</option>
              <option value="">Other…</option>
            </select>
          </label>
          <button type="button" class="ghost-button rel-remove" @click="remove(rel.id)">Remove</button>
        </div>
        <label class="rel-notes">Notes <textarea v-model="rel.notes" rows="2"></textarea></label>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import type { CharacterDraft, Relation } from "~/types/character";
import { RELATION_STATUSES } from "~/utils/dnd-constants";

const props = defineProps<{ character: CharacterDraft }>();

const relations = computed({
  get: () => props.character.relations ?? [],
  set: (v) => { props.character.relations = v; },
});

const add = () => {
  const next: Relation = {
    id: crypto.randomUUID(),
    name: "",
    race: "",
    status: "Known",
    notes: "",
  };
  props.character.relations = [...(props.character.relations ?? []), next];
};

const remove = (id: string) => {
  props.character.relations = (props.character.relations ?? []).filter((r) => r.id !== id);
};
</script>

<style scoped>
.rel-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; }

.rel-item {
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: 4px;
  background: var(--bg-soft);
  display: grid;
  gap: 10px;
}

.rel-grid {
  display: grid;
  grid-template-columns: 2fr 1.4fr 1.2fr auto;
  gap: 10px;
  align-items: end;
}

@media (max-width: 600px) {
  .rel-grid { grid-template-columns: 1fr 1fr; }
  .rel-remove { grid-column: 1 / -1; }
}

.rel-remove { min-height: 38px; align-self: end; }

.rel-notes textarea {
  resize: vertical;
  font-family: "EB Garamond", serif;
}
</style>
