<template>
  <section v-if="allChips.length" class="summary panel">
    <div class="section-heading">
      <div>
        <p class="eyebrow">At a glance</p>
        <h2>Active Features &amp; Traits</h2>
      </div>
    </div>
    <div class="chip-rows">
      <div v-if="raceChips.length" class="chip-row">
        <span class="chip-label">Heritage</span>
        <a v-for="c in raceChips" :key="c.id" href="#heritage" class="chip">{{ c.name }}</a>
      </div>
      <div v-if="classChips.length" class="chip-row">
        <span class="chip-label">Class</span>
        <a v-for="c in classChips" :key="c.id" :href="`#${c.id}`" class="chip">{{ c.name }}<small> · L{{ c.level }}</small></a>
      </div>
      <div v-if="subclassChips.length" class="chip-row">
        <span class="chip-label">Path</span>
        <a v-for="c in subclassChips" :key="c.id" :href="`#${c.id}`" class="chip">{{ c.name }}<small> · L{{ c.level }}</small></a>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
type FeatureGroup = { level: number; features: { id: string; name: string }[] };

const props = defineProps<{
  raceFeatures: { name: string; id?: string }[];
  classFeaturesByLevel: FeatureGroup[];
  subclassFeaturesByLevel: FeatureGroup[];
}>();

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const raceChips = computed(() => props.raceFeatures.map((f, i) => ({ id: `race-${slug(f.name)}-${i}`, name: f.name })));

const classChips = computed(() =>
  props.classFeaturesByLevel.flatMap((g) =>
    g.features.map((f) => ({ id: `cl-${f.id}`, name: f.name, level: g.level })),
  ),
);

const subclassChips = computed(() =>
  props.subclassFeaturesByLevel.flatMap((g) =>
    g.features.map((f) => ({ id: `sc-${f.id}`, name: f.name, level: g.level })),
  ),
);

const allChips = computed(() => [...raceChips.value, ...classChips.value, ...subclassChips.value]);
</script>

<style scoped>
.summary { padding-top: 16px; padding-bottom: 16px; }

.chip-rows { display: grid; gap: 10px; }

.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.chip-label {
  font-family: "IM Fell English SC", serif;
  font-size: 0.7rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--gilt);
  margin-right: 6px;
  min-width: 70px;
}

.chip {
  display: inline-block;
  padding: 4px 10px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--bg-soft);
  color: var(--ink);
  font-size: 0.92rem;
  text-decoration: none;
  scroll-margin-top: 80px;
}
.chip:hover { border-color: var(--gilt); color: var(--gilt); }
.chip small { color: var(--ink-faint); font-style: italic; }
</style>
