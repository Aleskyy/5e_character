<template>
  <section class="panel">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Origin</p>
        <h2>Background</h2>
      </div>
    </div>

    <div class="bg-top">
      <label>Background <input v-model="bg.name" type="text" placeholder="Soldier, Sage…" /></label>
      <label>
        Alignment
        <select v-model="bg.alignment">
          <option value="">—</option>
          <option v-for="a in ALIGNMENTS" :key="a" :value="a">{{ a }}</option>
        </select>
      </label>
      <label>Experience <input v-model.number="bg.experience" type="number" min="0" /></label>
    </div>

    <div class="bg-text">
      <label>Personality Traits <textarea v-model="bg.personalityTraits" rows="2"></textarea></label>
      <label>Ideals <textarea v-model="bg.ideals" rows="2"></textarea></label>
      <label>Bonds <textarea v-model="bg.bonds" rows="2"></textarea></label>
      <label>Flaws <textarea v-model="bg.flaws" rows="2"></textarea></label>
      <label>Appearance <textarea v-model="bg.appearance" rows="2"></textarea></label>
      <label>Backstory <textarea v-model="bg.backstory" rows="4"></textarea></label>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { CharacterDraft, CharacterBackground } from "~/types/character";
import { ALIGNMENTS } from "~/utils/dnd-constants";

const props = defineProps<{ character: CharacterDraft }>();

const bg = computed<CharacterBackground>({
  get: () => props.character.background ?? {},
  set: (v) => { props.character.background = v; },
});

watch(bg, (v) => { props.character.background = { ...v }; }, { deep: true });
</script>

<style scoped>
.bg-top {
  display: grid;
  gap: 12px;
  margin-bottom: 14px;
}
@media (min-width: 520px) { .bg-top { grid-template-columns: 2fr 2fr 1fr; } }

.bg-text {
  display: grid;
  gap: 12px;
}
@media (min-width: 760px) { .bg-text { grid-template-columns: repeat(2, minmax(0, 1fr)); } }

textarea {
  resize: vertical;
  font-family: "EB Garamond", serif;
  min-height: 60px;
}
</style>
