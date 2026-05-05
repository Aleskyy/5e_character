<template>
  <section class="panel" v-if="resources.length">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Wellsprings</p>
        <h2>{{ className }} Resources</h2>
      </div>
      <div class="rest-actions">
        <button type="button" class="ghost-button" @click="shortRest">Short rest</button>
        <button type="button" class="ghost-button" @click="longRest">Long rest</button>
      </div>
    </div>

    <div class="res-list">
      <div v-for="res in resources" :key="res.key" class="res-row">
        <div class="res-head">
          <span class="res-name">{{ res.name }}</span>
          <span class="res-rest" :class="res.rest">{{ res.rest === "short" ? "short rest" : res.rest === "long" ? "long rest" : "static" }}</span>
        </div>
        <div class="res-controls" v-if="isFinite(res.max(level))">
          <div class="res-pips" v-if="res.max(level) <= 12">
            <button
              v-for="n in res.max(level)"
              :key="n"
              type="button"
              class="pip"
              :class="{ spent: n <= used(res.key) }"
              @click="toggleUse(res.key, n)"
            ></button>
          </div>
          <div class="res-numeric" v-else>
            <button type="button" @click="adjust(res.key, -1, res.max(level))">−</button>
            <span>{{ Math.max(0, res.max(level) - used(res.key)) }} / {{ res.max(level) }}</span>
            <button type="button" @click="adjust(res.key, 1, res.max(level))">+</button>
          </div>
        </div>
        <div v-else class="res-controls">
          <span class="muted">Always available</span>
        </div>
        <p v-if="res.description" class="muted res-desc">{{ res.description }}</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { CharacterDraft } from "~/types/character";
import { CLASS_RESOURCES } from "~/utils/class-resources";

const props = defineProps<{
  character: CharacterDraft;
  className: string;
  level: number;
}>();

const resources = computed(() => CLASS_RESOURCES[props.className] ?? []);

const used = (key: string) => props.character.classResourcesUsed?.[key] ?? 0;

const setUsed = (key: string, value: number) => {
  const next = { ...(props.character.classResourcesUsed ?? {}) };
  if (value <= 0) delete next[key]; else next[key] = value;
  props.character.classResourcesUsed = next;
};

const toggleUse = (key: string, n: number) => {
  const cur = used(key);
  setUsed(key, n <= cur ? n - 1 : n);
};

const adjust = (key: string, delta: number, max: number) => {
  const cur = used(key);
  setUsed(key, Math.max(0, Math.min(max, cur + delta)));
};

const shortRest = () => {
  const next = { ...(props.character.classResourcesUsed ?? {}) };
  for (const res of resources.value) if (res.rest === "short") delete next[res.key];
  props.character.classResourcesUsed = next;
};

const longRest = () => {
  props.character.classResourcesUsed = {};
};
</script>

<style scoped>
.rest-actions { display: flex; gap: 8px; }

.res-list { display: grid; gap: 12px; }

.res-row {
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: 4px;
  background: var(--bg-soft);
}

.res-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.res-name { font-family: "IM Fell English", serif; font-size: 1.1rem; }

.res-rest {
  font-family: "IM Fell English SC", serif;
  font-size: 0.7rem;
  letter-spacing: 0.14em;
  color: var(--ink-faint);
  text-transform: uppercase;
}
.res-rest.short { color: var(--gilt); }
.res-rest.long { color: var(--rubric); }

.res-controls { display: flex; align-items: center; gap: 10px; }

.res-pips { display: flex; flex-wrap: wrap; gap: 6px; }
.pip {
  width: 22px; height: 22px; min-height: auto; padding: 0;
  border-radius: 50%; border: 1px solid var(--gilt); background: var(--gilt-soft);
}
.pip.spent { background: transparent; border-style: dashed; border-color: var(--ink-faint); }

.res-numeric {
  display: flex; align-items: center; gap: 10px;
  font-family: "IM Fell English", serif; font-size: 1.05rem;
}
.res-numeric button {
  width: 32px; height: 32px; min-height: auto; padding: 0;
  border-radius: 4px;
}

.res-desc { margin: 8px 0 0; font-size: 0.86rem; }
</style>
