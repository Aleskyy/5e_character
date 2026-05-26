<template>
  <main class="page">
    <nav class="crumbs">
      <NuxtLink to="/">Library</NuxtLink>
      <span class="sep">›</span>
      <span>New Character</span>
    </nav>

    <header class="hero">
      <p class="eyebrow">Creation</p>
      <h1>New Character</h1>
      <p class="lede">Pick class, race, abilities, and starting spells. Save to add to your library.</p>
    </header>

    <section class="panel">
      <div class="section-heading">
        <div><p class="eyebrow">Identity</p><h2>Core choices</h2></div>
      </div>

      <div class="identity-row">
        <button type="button" class="char-avatar" :class="{ empty: !draft.imageUrl }" @click="imageModalOpen = true" aria-label="Edit character image">
          <img v-if="draft.imageUrl" :src="draft.imageUrl" alt="" />
          <span v-else>＋</span>
        </button>
        <p class="muted small">Click to add an image (URL or upload).</p>
      </div>

      <div class="form-grid">
        <label>Name <input v-model="draft.name" type="text" autocomplete="off" /></label>

        <label>Race
          <select v-model="draft.raceId">
            <option value="">Choose a race</option>
            <option v-for="o in raceOptions" :key="o.id" :value="o.id">{{ o.name }} ({{ o.source }})</option>
          </select>
        </label>

        <label>Max HP <input v-model.number="draft.maxHp" type="number" min="1" /></label>
      </div>

      <div class="section-heading classes-heading">
        <div><p class="eyebrow">Classes</p><h2>Class & levels</h2></div>
      </div>
      <ClassesEditor
        v-model="draft.classes"
        :classes="classes ?? []"
        :subclasses="subclasses ?? []"
        :ability-scores="draft.abilityScores"
      />

      <button type="button" class="primary-button save-button" @click="saveCharacter">Save character</button>
    </section>

    <CharacterImageModal
      :open="imageModalOpen"
      :model-value="draft.imageUrl"
      @close="imageModalOpen = false"
      @update="(v) => (draft.imageUrl = v)"
    />

    <section class="panel">
      <div class="section-heading">
        <div><p class="eyebrow">Abilities</p><h2>Scores and modifiers</h2></div>
      </div>
      <div class="ability-grid">
        <label v-for="ability in abilities" :key="ability" class="ability-card">
          <span>{{ ability.toUpperCase() }}</span>
          <input v-model.number="draft.abilityScores[ability]" type="number" min="1" max="30" />
          <strong>{{ signed(abilityModifier(draft.abilityScores[ability])) }}</strong>
        </label>
      </div>
    </section>

    <section class="panel">
      <div class="section-heading">
        <div><p class="eyebrow">Spells</p><h2>{{ selectedSpells.length }} selected</h2></div>
      </div>
      <div class="spell-controls">
        <label>Search <input v-model="spellSearch" type="search" autocomplete="off" /></label>
        <label>Level
          <select v-model.number="spellLevelFilter">
            <option :value="-1">All</option>
            <option :value="0">Cantrips</option>
            <option v-for="level in 9" :key="level" :value="level">Level {{ level }}</option>
          </select>
        </label>
      </div>
      <div class="spell-list">
        <label v-for="spell in visibleSpells" :key="spell.id" class="spell-row">
          <input type="checkbox" :checked="draft.selectedSpellIds.includes(spell.id)" @change="toggleSpell(spell.id)" />
          <span>
            {{ spell.name }}
            <small>{{ spellLevelLabel(spell.data.level) }} · {{ spell.source }}</small>
          </span>
        </label>
      </div>
      <p class="muted spell-count">Showing {{ visibleSpells.length }} of {{ availableSpells.length }} available spells.</p>
    </section>
  </main>
</template>

<script setup lang="ts">
import type { CharacterDraft } from "~/types/character";
import type { ClassData, RaceData, RulesEntity, SpellData, SubclassData } from "~/types/rules";
import {
  abilities,
  abilityModifier,
  createEmptyCharacter,
  signed,
} from "~/utils/character";
import { spellMatchesClass, subclassAdditionalSpellKeys } from "~/utils/spell-filter";

const router = useRouter();
const { save } = useCharacters();

const { data: classes } = useFetch<RulesEntity<ClassData>[]>("/data/classes.json", { default: () => [], server: false });
const { data: races } = useFetch<RulesEntity<RaceData>[]>("/data/races.json", { default: () => [], server: false });
const { data: subclasses } = useFetch<RulesEntity<SubclassData>[]>("/data/subclasses.json", { default: () => [], server: false });
const { data: spells } = useFetch<RulesEntity<SpellData>[]>("/data/spells.json", { default: () => [], server: false });

const { spells: hbSpells, races: hbRaces, subraces: hbSubraces, load: loadHomebrew } = useHomebrew();
onMounted(() => loadHomebrew());

const draft = reactive<CharacterDraft>(createEmptyCharacter());
if (draft.classes.length === 0) draft.classes.push({ classId: "", subclassId: "", level: 1 });
const imageModalOpen = ref(false);
const spellSearch = ref("");
const spellLevelFilter = ref(-1);

const raceOptions = computed(() => [
  ...hbRaces.value.map((r) => ({ id: r.id, name: r.name, source: "Homebrew", sourceType: "homebrew" as const })),
  ...hbSubraces.value.map((r) => ({ id: r.id, name: r.name, source: "Homebrew", sourceType: "homebrew" as const })),
  ...races.value
    .filter((item) => !item.data.traitTags.includes("NPC Race"))
    .sort((a, b) => a.name.localeCompare(b.name) || a.source.localeCompare(b.source))
    .map((r) => ({ id: r.id, name: r.name, source: r.source, sourceType: r.sourceType })),
]);

const primaryClass = computed(() =>
  classes.value.find((c) => c.id === draft.classes[0]?.classId),
);

const resolvedEntries = computed(() =>
  draft.classes.map((entry) => ({
    entry,
    cls: classes.value.find((c) => c.id === entry.classId),
    sub: subclasses.value.find((s) => s.id === entry.subclassId),
  })),
);

const selectedSpells = computed(() => spells.value.filter((spell) => draft.selectedSpellIds.includes(spell.id)));

const hbSpellsAsRules = computed(() =>
  hbSpells.value.map((s) => ({
    id: s.id,
    kind: "spell" as const,
    name: s.name,
    source: "Homebrew",
    sourceType: "homebrew" as const,
    data: {
      page: null, level: s.level, school: s.school ?? "", time: [], range: s.range ?? null,
      components: s.components, duration: [],
      entries: [s.description, ...(s.diceCount && s.diceFaces ? [`Dice: ${s.diceCount}d${s.diceFaces}`] : [])],
      entriesHigherLevel: [], damageInflict: [], savingThrow: [], spellAttack: [],
      miscTags: [], areaTags: [], classes: [], classVariants: [], subclasses: [],
    },
  })),
);

const availableSpells = computed(() => {
  const matchOne = (s: RulesEntity<SpellData>) =>
    resolvedEntries.value.some(({ cls, sub }) =>
      cls && spellMatchesClass(
        s, cls.name, cls.source, sub, subclassAdditionalSpellKeys(sub, spells.value),
      ),
    );
  return [
    ...hbSpellsAsRules.value,
    ...spells.value.filter(matchOne),
  ];
});

const visibleSpells = computed(() => {
  const search = spellSearch.value.trim().toLowerCase();
  return availableSpells.value
    .filter((s) => spellLevelFilter.value === -1 || s.data.level === spellLevelFilter.value)
    .filter((s) => !search || s.name.toLowerCase().includes(search))
    .sort((a, b) => a.data.level - b.data.level || a.name.localeCompare(b.name))
    .slice(0, 30);
});

const cloneDraft = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

const saveCharacter = () => {
  const saved = save(cloneDraft(draft));
  router.push(`/character/${saved.id}`);
};

const toggleSpell = (spellId: string) => {
  draft.selectedSpellIds = draft.selectedSpellIds.includes(spellId)
    ? draft.selectedSpellIds.filter((id) => id !== spellId)
    : [...draft.selectedSpellIds, spellId];
};

const spellLevelLabel = (level: number) => (level === 0 ? "Cantrip" : `Level ${level}`);

watch(
  () => JSON.stringify(draft.classes),
  () => {
    if (spells.value.length) {
      draft.selectedSpellIds = draft.selectedSpellIds.filter((spellId) =>
        availableSpells.value.some((spell) => spell.id === spellId),
      );
    }
    const primary = primaryClass.value;
    if (primary) {
      const conMod = abilityModifier(draft.abilityScores.con);
      const hitDie = primary.data.hitDie?.faces ?? 8;
      const suggestedHp = Math.max(1, hitDie + conMod);
      if (draft.maxHp === 8 && draft.currentHp === 8) {
        draft.maxHp = suggestedHp;
        draft.currentHp = suggestedHp;
      }
    }
  },
);
</script>

<style scoped>
.save-button { width: 100%; margin-top: 16px; }

.identity-row { display: flex; align-items: center; gap: 14px; margin-bottom: 12px; flex-wrap: wrap; }
.identity-row .muted { margin: 0; }
.identity-row .small { font-size: 0.82rem; }
.char-avatar {
  flex: 0 0 auto;
  width: 96px; height: 96px;
  padding: 0; min-height: auto;
  border: 1px solid var(--gilt-soft);
  border-radius: 6px;
  background: var(--bg-soft);
  overflow: hidden;
  display: grid; place-items: center;
  cursor: pointer;
}
.char-avatar:hover { border-color: var(--gilt); }
.char-avatar img { width: 100%; height: 100%; object-fit: cover; }
.char-avatar.empty span { font-family: "IM Fell English", serif; font-size: 1.8rem; color: var(--ink-faint); }

.ability-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
.ability-card { display: grid; gap: 6px; padding: 12px 8px 10px; text-align: center; border: 1px solid var(--line); border-radius: 4px; background: var(--bg-panel-2); font-family: "IM Fell English SC", serif; letter-spacing: 0.14em; text-transform: uppercase; }
.ability-card > span { font-size: 0.7rem; color: var(--gilt); letter-spacing: 0.22em; }
.ability-card input { border: none; background: transparent; text-align: center; font-family: "IM Fell English", serif; font-size: 1.7rem; color: var(--ink); padding: 0; min-height: auto; }
.ability-card input:focus { box-shadow: none; }
.ability-card strong { display: inline-block; padding: 2px 10px; border: 1px solid var(--line); border-radius: 999px; background: var(--bg); font-family: "EB Garamond", serif; font-weight: 600; font-size: 0.92rem; letter-spacing: 0; color: var(--ink); }

.spell-list { display: grid; gap: 8px; }
.spell-row { display: grid; grid-template-columns: 24px 1fr; align-items: start; padding: 12px 14px; border: 1px solid var(--line); border-radius: 4px; background: var(--bg-soft); text-transform: none; letter-spacing: 0; font-family: "EB Garamond", serif; font-size: 1rem; color: var(--ink); cursor: pointer; }
.spell-row:hover { border-color: var(--gilt-soft); background: var(--bg-panel-2); }
.spell-row:has(input:checked) { border-color: var(--rubric); background: rgba(199, 92, 75, 0.08); }
.spell-row input { width: 16px; min-height: 16px; margin-top: 6px; accent-color: var(--rubric); }
.spell-row span { display: grid; gap: 2px; }
.spell-row small { color: var(--ink-faint); font-style: italic; font-size: 0.86rem; }
.spell-count { margin: 14px 0 0; text-align: center; font-size: 0.92rem; }

.classes-heading { margin-top: 18px; }

@media (min-width: 760px) {
  .ability-grid { grid-template-columns: repeat(6, minmax(0, 1fr)); }
}
</style>
