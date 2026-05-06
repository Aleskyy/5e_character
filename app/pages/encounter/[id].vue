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
        <button type="button" class="ghost-button" @click="importOpen = true">Import by code</button>
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
        <select v-model="npcPick">
          <option value="">— Saved NPC (optional) —</option>
          <option v-for="n in savedNpcs" :key="n.id" :value="n.id">{{ n.name }}{{ n.race ? ` (${n.race})` : "" }}</option>
        </select>
        <button type="button" class="primary-button" :disabled="!npcPick" @click="addSavedNpc">Add saved</button>
        <input v-model="npcName" type="text" placeholder="…or type a name" @keydown.enter="addNpc" />
        <button type="button" class="primary-button" @click="addNpc" :disabled="!npcName.trim()">Add by name</button>
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
            <label class="stat-cell"><span>HP</span>
              <span class="hp-pair">
                <input type="number" v-model.number="entry.currentHp" :placeholder="String(entry.maxHp ?? '')" aria-label="Current HP" />
                <span class="hp-sep">/</span>
                <input type="number" v-model.number="entry.maxHp" aria-label="Max HP" />
              </span>
            </label>
            <label class="stat-cell"><span>AC</span>
              <input type="number" v-model.number="entry.ac" aria-label="AC" />
            </label>
            <label class="stat-cell"><span>Perc</span>
              <input type="number" v-model.number="entry.perception" aria-label="Passive Perception" />
            </label>
            <label v-if="entry.kind === 'pc'" class="stat-cell"><span>Ins</span>
              <input type="number" v-model.number="entry.insight" aria-label="Passive Insight" />
            </label>
          </template>
          <button type="button" class="ghost-button small" @click="openStatus(entry)">Status</button>
          <button v-if="entry.kind === 'pc' && entry.refId" type="button" class="ghost-button small" @click="openPcSheet(entry.refId)">Sheet</button>
          <button v-else-if="entry.kind === 'monster'" type="button" class="ghost-button small" @click="openMonsterSheet(entry)">Sheet</button>
          <button type="button" class="danger-button small" @click="removeEntry(entry.id)">×</button>
          <div v-if="(entry.conditions?.length || (entry.exhaustion ?? 0) > 0)" class="cond-row">
            <span v-for="c in entry.conditions ?? []" :key="c" class="cond-tag">{{ c }}</span>
            <span v-if="(entry.exhaustion ?? 0) > 0" class="cond-tag exh">Exh {{ entry.exhaustion }}</span>
          </div>
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

    <ShareCharacterModal
      :open="importOpen"
      :character="null"
      @close="importOpen = false"
      @import="onImportPc"
    />

    <StatusModal
      v-if="statusEntry"
      :open="!!statusEntry"
      :name="statusEntry.name"
      :conditions="statusEntry.conditions ?? []"
      :exhaustion="statusEntry.exhaustion ?? 0"
      @close="statusEntry = null"
      @update="applyStatus"
    />

    <MonsterSheetModal
      v-if="monsterSheet"
      :open="!!monsterSheet"
      :monster="monsterSheet"
      @close="monsterSheet = null"
    />

    <CombatModal
      v-if="pcSheet"
      :open="!!pcSheet"
      :character="pcSheet"
      :prof-bonus="pcSheetProf"
      :selected-class="pcSheetClass"
      :selected-subclass="pcSheetSubclass"
      :spells="spells ?? []"
      @close="pcSheetId = null"
    />
  </main>

  <main class="page" v-else>
    <nav class="crumbs"><NuxtLink to="/encounters">Encounters</NuxtLink><span class="sep">›</span><span>Not found</span></nav>
    <p class="muted">Encounter not found. <NuxtLink to="/encounters">Return</NuxtLink></p>
  </main>
</template>

<script setup lang="ts">
import type { Encounter, EncounterEntry, CustomMonster } from "~/types/encounter";
import type { CharacterDraft } from "~/types/character";
import type { ClassData, RulesEntity, SpellData, SubclassData } from "~/types/rules";
import { abilityModifier, proficiencyBonus } from "~/utils/character";
import { customMonsterToSheet } from "~/utils/custom-monster-adapter";

type MonsterEntity = {
  id: string; name: string; source: string;
  data: any;
};

const ABILITIES = ["str", "dex", "con", "int", "wis", "cha"] as const;

const route = useRoute();
const router = useRouter();
const id = computed(() => String(route.params.id));

const { encounters, customMonsters, load, upsert, upsertMonster } = useEncounters();
const { characters, load: loadChars, save: saveCharacter } = useCharacters();
const { items: itemLibrary, load: loadItems } = useItemLibrary();
const { data: monsters } = useFetch<MonsterEntity[]>("/data/monsters.json", { default: () => [], server: false });
const { data: classes } = useFetch<RulesEntity<ClassData>[]>("/data/classes.json", { default: () => [], server: false });
const { data: subclasses } = useFetch<RulesEntity<SubclassData>[]>("/data/subclasses.json", { default: () => [], server: false });
const { data: spells } = useFetch<RulesEntity<SpellData>[]>("/data/spells.json", { default: () => [], server: false });

const encounter = ref<Encounter | null>(null);
const saveStatus = ref("");
let saveTimer: ReturnType<typeof setTimeout> | null = null;

const hydrate = () => {
  const found = encounters.value.find((e) => e.id === id.value);
  encounter.value = found ? JSON.parse(JSON.stringify(found)) : null;
};

onMounted(() => { load(); loadChars(); loadItems(); loadHomebrew(); hydrate(); });
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
const npcPick = ref("");
const { npcs: savedNpcs, load: loadHomebrew } = useHomebrew();

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

const passiveSkill = (ch: CharacterDraft, key: "perception" | "insight") => {
  const mod = abilityModifier(ch.abilityScores?.wis ?? 10);
  const isProf = ch.skillProficiencies?.includes(key) ?? false;
  const isExp = ch.skillExpertise?.includes(key) ?? false;
  const pb = proficiencyBonus(ch.level || 1);
  const bonus = isExp ? pb * 2 : isProf ? pb : 0;
  return 10 + mod + bonus;
};

const pcAc = (ch: CharacterDraft) => {
  const equippedBonus = (ch.inventory ?? [])
    .filter((e) => e.equipped)
    .map((e) => itemLibrary.value.find((i) => i.id === e.itemId))
    .reduce((sum, item) => sum + (item?.acBonus ?? 0), 0);
  const base = ch.armorClass != null ? ch.armorClass : 10 + abilityModifier(ch.abilityScores?.dex ?? 10);
  return base + equippedBonus;
};

const monsterAcNumber = (ac: unknown): number | undefined => {
  if (typeof ac === "number") return ac;
  if (Array.isArray(ac)) {
    const first = ac[0];
    if (typeof first === "number") return first;
    if (first && typeof first === "object" && typeof (first as any).ac === "number") return (first as any).ac;
  }
  return undefined;
};

const monsterInsight = (data: any): number | undefined => {
  const wis = data?.wis;
  if (typeof wis !== "number") return undefined;
  const mod = Math.floor((wis - 10) / 2);
  const skill = data?.skill?.insight;
  if (typeof skill === "string") return 10 + Number.parseInt(skill, 10);
  return 10 + mod;
};

const addPc = () => {
  const ch = characters.value.find((c) => c.id === pcPick.value);
  if (!ch) return;
  addEntry({
    id: newEntryId(), kind: "pc", refId: ch.id, name: ch.name || "Unnamed",
    currentHp: ch.currentHp, maxHp: ch.maxHp, ac: pcAc(ch), initiative: undefined,
    perception: passiveSkill(ch, "perception"),
    insight: passiveSkill(ch, "insight"),
    conditions: [...(ch.conditions ?? [])],
    exhaustion: ch.exhaustion ?? 0,
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
      currentHp: m.data.hp?.average ?? undefined,
      maxHp: m.data.hp?.average ?? undefined,
      ac: monsterAcNumber(m.data.ac),
      perception: typeof m.data.passive === "number" ? m.data.passive : undefined,
      insight: monsterInsight(m.data),
      conditions: [],
      exhaustion: 0,
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
      conditions: [], exhaustion: 0,
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

const addSavedNpc = () => {
  const npc = savedNpcs.value.find((n) => n.id === npcPick.value);
  if (!npc) return;
  addEntry({ id: newEntryId(), kind: "npc", refId: npc.id, name: npc.name, notes: npc.description });
  npcPick.value = "";
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

const statusEntry = ref<EncounterEntry | null>(null);
const openStatus = (entry: EncounterEntry) => { statusEntry.value = entry; };
const applyStatus = (payload: { conditions: string[]; exhaustion: number }) => {
  if (!encounter.value || !statusEntry.value) return;
  const target = statusEntry.value.id;
  encounter.value.entries = encounter.value.entries.map((e) =>
    e.id === target ? { ...e, conditions: payload.conditions, exhaustion: payload.exhaustion } : e,
  );
  statusEntry.value = { ...statusEntry.value, ...payload };
};

const monsterSheet = ref<MonsterEntity | null>(null);
const openMonsterSheet = (entry: EncounterEntry) => {
  if (!entry.refId) return;
  const official = monsters.value.find((x) => x.id === entry.refId);
  if (official) { monsterSheet.value = official; return; }
  const custom = customMonsters.value.find((x) => x.id === entry.refId);
  if (custom) monsterSheet.value = customMonsterToSheet(custom) as unknown as MonsterEntity;
};

const pcSheetId = ref<string | null>(null);
const openPcSheet = (cid: string) => { pcSheetId.value = cid; };
const pcSheet = computed(() => characters.value.find((c) => c.id === pcSheetId.value) ?? null);
const pcSheetClass = computed(() => pcSheet.value ? classes.value.find((c) => c.id === pcSheet.value!.classId) : undefined);
const pcSheetSubclass = computed(() => pcSheet.value ? subclasses.value.find((s) => s.id === pcSheet.value!.subclassId) : undefined);
const pcSheetProf = computed(() => proficiencyBonus(pcSheet.value?.level ?? 1));

const importOpen = ref(false);
const onImportPc = (incoming: CharacterDraft) => {
  const { id: _drop, ...rest } = incoming as CharacterDraft & { id?: string };
  const saved = saveCharacter(JSON.parse(JSON.stringify(rest)) as CharacterDraft);
  pcPick.value = saved.id;
  importOpen.value = false;
  nextTick(() => addPc());
};

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
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  padding: 8px 12px;
  border: 1px solid var(--line);
  border-radius: 4px;
  background: var(--bg-soft);
  cursor: grab;
}
.entry-name { flex: 1 1 160px; min-width: 120px; }
.init { width: 56px; }
.stat-cell { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.stat-cell > span { font-family: "IM Fell English SC", serif; font-size: 0.62rem; letter-spacing: 0.12em; color: var(--ink-faint); }
.stat-cell input { width: 60px; text-align: center; padding: 2px 4px; }
.hp-pair { display: flex; align-items: center; gap: 2px; }
.hp-pair input { width: 50px; text-align: center; padding: 2px 4px; }
.cond-row { flex-basis: 100%; display: flex; flex-wrap: wrap; gap: 4px; padding-top: 4px; }
.cond-tag { font-size: 0.72rem; padding: 1px 8px; border: 1px solid var(--rubric); border-radius: 999px; background: rgba(199,92,75,0.1); text-transform: capitalize; }
.cond-tag.exh { border-color: var(--gilt); color: var(--gilt); background: rgba(201,161,85,0.08); }
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
