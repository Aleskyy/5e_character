<template>
  <main class="page" v-if="encounter">
    <nav class="crumbs">
      <NuxtLink to="/">Library</NuxtLink>
      <span class="sep">›</span>
      <NuxtLink to="/encounters">Encounters</NuxtLink>
      <span class="sep">›</span>
      <span>{{ encounter.name }}</span>
    </nav>

    <header class="sheet-header">
      <div class="grow">
        <p class="eyebrow">Battlefield</p>
        <input v-model="encounter.name" class="title-input" placeholder="Encounter name" />
        <input v-model="encounter.description" class="desc-input" placeholder="Description (optional)" />
      </div>
      <div class="header-actions">
        <button type="button" class="ghost-button" @click="rollAllInitiatives">Roll All Init</button>
        <button type="button" class="ghost-button" @click="sortByInit">Sort by Init</button>
      </div>
    </header>

    <section class="panel add-panel">
      <p class="eyebrow">Add Combatant</p>
      <div class="add-tabs">
        <button :class="{ active: addTab === 'pc' }" @click="addTab = 'pc'">PC (existing)</button>
        <button :class="{ active: addTab === 'monster' }" @click="addTab = 'monster'">Monster (5e)</button>
        <button :class="{ active: addTab === 'custom' }" @click="addTab = 'custom'">Custom Monster</button>
        <button :class="{ active: addTab === 'npc' }" @click="addTab = 'npc'">NPC (name only)</button>
      </div>

      <div v-if="addTab === 'pc'" class="add-body">
        <select v-model="pcPick">
          <option value="">Choose character…</option>
          <option v-for="c in characters" :key="c.id" :value="c.id">{{ c.name }} (Lv {{ c.level }})</option>
        </select>
        <button type="button" class="primary-button" @click="addPc" :disabled="!pcPick">Add</button>
      </div>

      <div v-if="addTab === 'monster'" class="add-body">
        <input v-model="monsterSearch" type="search" placeholder="Search monsters…" />
        <select v-model="monsterPick">
          <option value="">Choose…</option>
          <option v-for="m in monsterMatches" :key="m.id" :value="m.id">{{ m.name }} ({{ m.source }}) · CR {{ m.data.cr || "?" }}</option>
        </select>
        <label class="qty">× <input v-model.number="monsterQty" type="number" min="1" max="20" /></label>
        <button type="button" class="primary-button" @click="addMonster" :disabled="!monsterPick">Add</button>
      </div>

      <div v-if="addTab === 'custom'" class="add-body">
        <select v-model="customPick">
          <option value="">Pick saved custom…</option>
          <option v-for="m in customMonsters" :key="m.id" :value="m.id">{{ m.name }}</option>
        </select>
        <label class="qty">× <input v-model.number="customQty" type="number" min="1" max="20" /></label>
        <button type="button" class="primary-button" @click="addCustom" :disabled="!customPick">Add</button>
        <button type="button" class="ghost-button" @click="openCustomEditor()">+ New Custom</button>
      </div>

      <div v-if="addTab === 'npc'" class="add-body">
        <input v-model="npcName" type="text" placeholder="NPC name" @keydown.enter="addNpc" />
        <button type="button" class="primary-button" @click="addNpc" :disabled="!npcName.trim()">Add</button>
      </div>
    </section>

    <section class="panel">
      <div class="section-heading">
        <div><p class="eyebrow">Order</p><h2>Roster ({{ encounter.entries.length }})</h2></div>
        <span class="muted hint">Drag rows to reorder · Edit init for sorting</span>
      </div>
      <ul v-if="encounter.entries.length" class="roster">
        <li
          v-for="(entry, idx) in encounter.entries"
          :key="entry.id"
          class="roster-row"
          :class="`kind-${entry.kind}`"
          draggable="true"
          @dragstart="dragStart(idx)"
          @dragover.prevent
          @drop="dragDrop(idx)"
        >
          <span class="drag">⋮⋮</span>
          <input type="number" class="init" v-model.number="entry.initiative" placeholder="—" aria-label="Initiative" />
          <span class="kind-tag">{{ kindLabel(entry.kind) }}</span>
          <input v-model="entry.name" class="entry-name" />
          <template v-if="entry.kind !== 'npc'">
            <input type="number" class="hp" v-model.number="entry.currentHp" :placeholder="String(entry.maxHp ?? '')" aria-label="Current HP" />
            <span class="hp-sep">/</span>
            <input type="number" class="hp" v-model.number="entry.maxHp" aria-label="Max HP" />
            <input type="number" class="ac" v-model.number="entry.ac" placeholder="AC" aria-label="AC" />
          </template>
          <button v-if="entry.kind === 'pc' && entry.refId" type="button" class="ghost-button small" @click="openCharacter(entry.refId)">Sheet</button>
          <button type="button" class="danger-button small" @click="removeEntry(entry.id)">×</button>
        </li>
      </ul>
      <p v-else class="muted">Empty roster. Add combatants above.</p>

      <details v-for="entry in entriesWithNotes" :key="`n-${entry.id}`" class="notes-block">
        <summary>{{ entry.name }} — notes</summary>
        <textarea v-model="entry.notes" rows="3" placeholder="Conditions, context, behavior..."></textarea>
      </details>
    </section>

    <section v-if="customDraft" class="panel custom-editor">
      <div class="section-heading">
        <div><p class="eyebrow">Custom</p><h2>{{ customDraft.id ? "Edit" : "New" }} Monster</h2></div>
      </div>
      <div class="form-grid two">
        <label>Name <input v-model="customDraft.name" type="text" /></label>
        <label>Type <input v-model="customDraft.type" type="text" placeholder="humanoid, beast, etc." /></label>
        <label>Size <input v-model="customDraft.size" type="text" placeholder="M, L..." /></label>
        <label>CR <input v-model="customDraft.cr" type="text" placeholder="1/4, 2..." /></label>
        <label>AC <input v-model.number="customDraft.ac" type="number" /></label>
        <label>HP <input v-model.number="customDraft.hp" type="number" /></label>
        <label>Speed <input v-model.number="customDraft.speed" type="number" /></label>
      </div>
      <div class="ability-grid">
        <label v-for="ab in ABILITIES" :key="ab" class="ab-bonus">
          <span>{{ ab.toUpperCase() }}</span>
          <input type="number" v-model.number="customDraft.abilityScores[ab]" />
        </label>
      </div>
      <label class="full">Skills <input v-model="customDraft.skills" type="text" placeholder="Stealth +6, Perception +3" /></label>
      <label class="full">Senses <input v-model="customDraft.senses" type="text" placeholder="darkvision 60ft, passive 11" /></label>
      <label class="full">Traits <textarea v-model="customDraft.traits" rows="3"></textarea></label>
      <label class="full">Actions <textarea v-model="customDraft.actions" rows="4"></textarea></label>
      <label class="full">Notes <textarea v-model="customDraft.notes" rows="2"></textarea></label>
      <div class="editor-actions">
        <button type="button" class="ghost-button" @click="customDraft = null">Cancel</button>
        <button type="button" class="primary-button" @click="saveCustom" :disabled="!customDraft.name">Save</button>
      </div>
    </section>

    <p class="muted save-status">{{ saveStatus }}</p>
  </main>

  <main class="page" v-else>
    <nav class="crumbs"><NuxtLink to="/encounters">Encounters</NuxtLink><span class="sep">›</span><span>Not found</span></nav>
    <p class="muted">Encounter not found. <NuxtLink to="/encounters">Return</NuxtLink></p>
  </main>
</template>

<script setup lang="ts">
import type { Encounter, EncounterEntry, CustomMonster } from "~/types/encounter";
import type { CharacterDraft } from "~/types/character";

type MonsterEntity = {
  id: string; name: string; source: string;
  data: { ac: number | null; hp: { average: number | null; formula: string | null }; cr: string | null; type: string };
};

const ABILITIES = ["str", "dex", "con", "int", "wis", "cha"] as const;

const route = useRoute();
const router = useRouter();
const id = computed(() => String(route.params.id));

const { encounters, customMonsters, load, upsert, upsertMonster } = useEncounters();
const { characters, load: loadChars } = useCharacters();
const { data: monsters } = useFetch<MonsterEntity[]>("/data/monsters.json", { default: () => [], server: false });

const encounter = ref<Encounter | null>(null);
const saveStatus = ref("");
let saveTimer: ReturnType<typeof setTimeout> | null = null;

const hydrate = () => {
  const found = encounters.value.find((e) => e.id === id.value);
  encounter.value = found ? JSON.parse(JSON.stringify(found)) : null;
};

onMounted(() => { load(); loadChars(); hydrate(); });
watch(() => id.value, hydrate);
watch(encounters, () => { if (!encounter.value) hydrate(); });

watch(encounter, (next) => {
  if (!next) return;
  if (saveTimer) clearTimeout(saveTimer);
  saveStatus.value = "Saving…";
  saveTimer = setTimeout(() => {
    upsert(JSON.parse(JSON.stringify(next)));
    saveStatus.value = `Saved ${new Date().toLocaleTimeString()}`;
  }, 300);
}, { deep: true });

const addTab = ref<"pc" | "monster" | "custom" | "npc">("monster");
const pcPick = ref("");
const monsterSearch = ref("");
const monsterPick = ref("");
const monsterQty = ref(1);
const customPick = ref("");
const customQty = ref(1);
const npcName = ref("");

const monsterMatches = computed(() => {
  const q = monsterSearch.value.trim().toLowerCase();
  if (!q) return monsters.value.slice(0, 50);
  return monsters.value.filter((m) => m.name.toLowerCase().includes(q)).slice(0, 100);
});

const newEntryId = () => `e:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 6)}`;

const addEntry = (entry: EncounterEntry) => {
  if (!encounter.value) return;
  encounter.value.entries = [...encounter.value.entries, entry];
};

const removeEntry = (eid: string) => {
  if (!encounter.value) return;
  encounter.value.entries = encounter.value.entries.filter((e) => e.id !== eid);
};

const addPc = () => {
  const ch = characters.value.find((c) => c.id === pcPick.value);
  if (!ch) return;
  addEntry({
    id: newEntryId(), kind: "pc", refId: ch.id, name: ch.name || "Unnamed",
    currentHp: ch.currentHp, maxHp: ch.maxHp, ac: ch.armorClass, initiative: undefined,
  });
  pcPick.value = "";
};

const addMonster = () => {
  const m = monsters.value.find((x) => x.id === monsterPick.value);
  if (!m) return;
  const qty = Math.max(1, monsterQty.value || 1);
  for (let i = 1; i <= qty; i++) {
    addEntry({
      id: newEntryId(), kind: "monster", refId: m.id,
      name: qty > 1 ? `${m.name} ${i}` : m.name,
      currentHp: m.data.hp.average ?? undefined,
      maxHp: m.data.hp.average ?? undefined,
      ac: m.data.ac ?? undefined,
    });
  }
  monsterPick.value = "";
};

const addCustom = () => {
  const m = customMonsters.value.find((x) => x.id === customPick.value);
  if (!m) return;
  const qty = Math.max(1, customQty.value || 1);
  for (let i = 1; i <= qty; i++) {
    addEntry({
      id: newEntryId(), kind: "monster", refId: m.id,
      name: qty > 1 ? `${m.name} ${i}` : m.name,
      currentHp: m.hp, maxHp: m.hp, ac: m.ac,
    });
  }
  customPick.value = "";
};

const addNpc = () => {
  const n = npcName.value.trim();
  if (!n) return;
  addEntry({ id: newEntryId(), kind: "npc", name: n });
  npcName.value = "";
};

const kindLabel = (k: EncounterEntry["kind"]) => k === "pc" ? "PC" : k === "monster" ? "MON" : "NPC";

const rollAllInitiatives = () => {
  if (!encounter.value) return;
  encounter.value.entries = encounter.value.entries.map((e) => ({
    ...e,
    initiative: 1 + Math.floor(Math.random() * 20),
  }));
};

const sortByInit = () => {
  if (!encounter.value) return;
  encounter.value.entries = [...encounter.value.entries].sort((a, b) => (b.initiative ?? -99) - (a.initiative ?? -99));
};

let dragIdx: number | null = null;
const dragStart = (i: number) => { dragIdx = i; };
const dragDrop = (i: number) => {
  if (dragIdx === null || dragIdx === i || !encounter.value) return;
  const arr = [...encounter.value.entries];
  const moved = arr.splice(dragIdx, 1)[0];
  if (!moved) return;
  arr.splice(i, 0, moved);
  encounter.value.entries = arr;
  dragIdx = null;
};

const openCharacter = (cid: string) => router.push(`/character/${cid}`);

const entriesWithNotes = computed(() => encounter.value?.entries.filter((e) => e.notes !== undefined && e.notes !== "") ?? []);

const customDraft = ref<CustomMonster | null>(null);
const openCustomEditor = (m?: CustomMonster) => {
  customDraft.value = m
    ? JSON.parse(JSON.stringify(m))
    : {
        id: "", name: "", ac: 10, hp: 10, speed: 30,
        abilityScores: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
        createdAt: new Date().toISOString(),
      };
};
const saveCustom = () => {
  if (!customDraft.value) return;
  const id = customDraft.value.id || `cmon:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 6)}`;
  upsertMonster({ ...customDraft.value, id });
  customDraft.value = null;
};
</script>

<style scoped>
.sheet-header { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap; padding: 8px 0 18px; border-bottom: 1px solid var(--line); margin-bottom: 12px; }
.grow { flex: 1; min-width: 280px; }
.title-input { font-family: "IM Fell English", serif; font-size: 2rem; padding: 4px 0; border: none; background: transparent; width: 100%; color: var(--ink); }
.title-input:focus { box-shadow: none; border-bottom: 1px solid var(--gilt); }
.desc-input { width: 100%; padding: 4px 0; border: none; background: transparent; font-style: italic; color: var(--ink-soft); }
.desc-input:focus { box-shadow: none; }
.header-actions { display: flex; gap: 8px; flex-wrap: wrap; }

.add-panel { margin-bottom: 14px; }
.add-tabs { display: flex; gap: 6px; flex-wrap: wrap; margin: 8px 0 12px; }
.add-tabs button { flex: 1; min-width: 110px; min-height: 34px; background: transparent; border: 1px solid var(--line); color: var(--ink-soft); padding: 0 12px; font-size: 0.82rem; }
.add-tabs button.active { background: var(--bg-panel-2); border-color: var(--gilt); color: var(--gilt); }

.add-body { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.add-body select, .add-body input[type=text], .add-body input[type=search] { flex: 1; min-width: 160px; }
.qty { display: flex; align-items: center; gap: 4px; font-family: "IM Fell English SC", serif; }
.qty input { width: 60px; }

.roster { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
.roster-row {
  display: grid;
  grid-template-columns: 22px 56px 50px 1fr 60px 12px 60px 60px auto auto;
  gap: 8px;
  align-items: center;
  padding: 8px 12px;
  border: 1px solid var(--line);
  border-radius: 4px;
  background: var(--bg-soft);
  cursor: grab;
}
.roster-row:active { cursor: grabbing; }
.roster-row.kind-pc { border-left: 3px solid var(--gilt); }
.roster-row.kind-monster { border-left: 3px solid var(--rubric); }
.roster-row.kind-npc { border-left: 3px solid var(--moss, var(--ink-soft)); }

.drag { color: var(--ink-faint); user-select: none; cursor: grab; }
.init { text-align: center; font-family: "IM Fell English", serif; font-size: 1.05rem; }
.kind-tag { font-family: "IM Fell English SC", serif; font-size: 0.7rem; letter-spacing: 0.14em; color: var(--gilt); text-align: center; }
.entry-name { background: transparent; border: none; font-family: "EB Garamond", serif; font-size: 1rem; }
.entry-name:focus { box-shadow: none; border-bottom: 1px solid var(--gilt); }
.hp { width: 56px; text-align: center; }
.hp-sep { color: var(--ink-faint); }
.ac { width: 56px; text-align: center; }
.small { min-height: 28px; padding: 0 8px; font-size: 0.78rem; }

.notes-block { margin-top: 10px; padding: 8px 12px; border: 1px dashed var(--line); border-radius: 4px; }
.notes-block summary { cursor: pointer; font-family: "IM Fell English SC", serif; font-size: 0.82rem; }

.form-grid.two { display: grid; gap: 8px; grid-template-columns: 1fr; }
@media (min-width: 520px) { .form-grid.two { grid-template-columns: 1fr 1fr 1fr; } }
.full { display: grid; }

.ability-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px; margin: 8px 0; }
.ab-bonus { display: grid; gap: 4px; padding: 6px; border: 1px solid var(--line); border-radius: 4px; background: var(--bg-soft); text-align: center; }
.ab-bonus span { font-family: "IM Fell English SC", serif; font-size: 0.7rem; letter-spacing: 0.14em; color: var(--gilt); }
.ab-bonus input { border: none; background: transparent; text-align: center; font-family: "IM Fell English", serif; font-size: 1.1rem; padding: 0; min-height: auto; }

.editor-actions { display: flex; justify-content: flex-end; gap: 8px; }

.hint { font-size: 0.78rem; }
.save-status { margin-top: 18px; text-align: right; font-size: 0.82rem; }
</style>
