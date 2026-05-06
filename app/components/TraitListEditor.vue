<template>
  <div class="trait-list">
    <div v-for="(t, i) in list" :key="i" class="trait-edit">
      <label>Name <input type="text" :value="t.name" @input="updateField(i, 'name', ($event.target as HTMLInputElement).value)" /></label>
      <textarea :value="t.description" rows="3" placeholder="Description" @input="updateField(i, 'description', ($event.target as HTMLTextAreaElement).value)"></textarea>
      <button type="button" class="danger-button small" @click="remove(i)">Remove</button>
    </div>
    <button type="button" class="ghost-button" @click="add">+ Add</button>
  </div>
</template>

<script setup lang="ts">
import type { MonsterTrait } from "~/types/encounter";

const props = defineProps<{ list: MonsterTrait[] }>();
const emit = defineEmits<{ (e: "update", v: MonsterTrait[]): void }>();

const add = () => emit("update", [...props.list, { name: "", description: "" }]);
const remove = (i: number) => emit("update", props.list.filter((_, idx) => idx !== i));
const updateField = (i: number, key: "name" | "description", val: string) => {
  emit("update", props.list.map((t, idx) => idx === i ? { ...t, [key]: val } : t));
};
</script>

<style scoped>
.trait-list { display: grid; gap: 8px; }
.trait-edit { display: grid; gap: 6px; padding: 10px; border: 1px solid var(--line); border-radius: 4px; background: var(--bg-soft); }
.trait-edit label { display: grid; gap: 3px; font-size: 0.78rem; color: var(--ink-faint); }
.danger-button.small { justify-self: flex-start; min-height: 28px; padding: 0 10px; font-size: 0.78rem; }
</style>
