<template>
  <main class="page">
    <nav class="crumbs">
      <NuxtLink to="/">Library</NuxtLink>
      <span class="sep">›</span>
      <span>Homebrew</span>
    </nav>

    <header class="hero">
      <p class="eyebrow">Forge</p>
      <h1>Homebrew Library</h1>
      <p class="lede">Custom spells, races, subraces, and classes — reusable across all characters.</p>
    </header>

    <div class="tabs">
      <button v-for="t in tabs" :key="t.key" :class="{ active: tab === t.key }" @click="tab = t.key">{{ t.label }}</button>
    </div>

    <section v-if="tab === 'items'" class="panel">
      <div class="section-heading">
        <div><p class="eyebrow">Inventory</p><h2>Custom Items ({{ items.length }})</h2></div>
        <button type="button" class="primary-button" @click="newItem">+ New Item</button>
      </div>
      <ul v-if="items.length" class="hb-list">
        <li v-for="it in items" :key="it.id" class="hb-row">
          <div class="hb-main">
            <strong>{{ it.name }}</strong>
            <small>{{ it.type }}{{ it.type === 'weapon' && it.damage ? ` · ${it.damage}${it.damageType ? ' ' + it.damageType : ''}` : '' }}{{ it.acBonus ? ` · AC +${it.acBonus}` : '' }}{{ it.weight ? ` · ${it.weight} lb` : '' }}</small>
          </div>
          <div class="hb-actions">
            <button type="button" class="ghost-button" @click="editItem(it)">Edit</button>
            <button type="button" class="danger-button" @click="confirmRemoveItem(it.id, it.name)">Delete</button>
          </div>
        </li>
      </ul>
      <p v-else class="muted">No homebrew items yet. Create here or from any character's Inventory panel.</p>

      <div v-if="itemDraft" class="editor">
        <h3>{{ itemDraft.id ? "Edit" : "New" }} Item</h3>
        <div class="form-grid two">
          <label>Name <input v-model="itemDraft.name" type="text" /></label>
          <label>Type
            <select v-model="itemDraft.type">
              <option value="misc">Misc</option>
              <option value="weapon">Weapon</option>
              <option value="armor">Armor</option>
              <option value="container">Container</option>
              <option value="consumable">Consumable</option>
            </select>
          </label>
          <label>Weight (lb) <input v-model.number="itemDraft.weight" type="number" min="0" step="0.1" /></label>
          <label v-if="itemDraft.type === 'armor'">AC Bonus <input v-model.number="itemDraft.acBonus" type="number" /></label>
        </div>

        <template v-if="itemDraft.type === 'weapon'">
          <p class="eyebrow">Weapon</p>
          <div class="form-grid two">
            <label>Damage Dice <input v-model="itemDraft.damage" type="text" placeholder="1d8" /></label>
            <label>Damage Type <input v-model="itemDraft.damageType" type="text" placeholder="slashing" /></label>
            <label>Ability
              <select v-model="itemDraft.damageAbility">
                <option v-for="a in ABILITIES" :key="a" :value="a">{{ a.toUpperCase() }}</option>
              </select>
            </label>
          </div>
        </template>

        <template v-if="itemDraft.type === 'container'">
          <label class="check">
            <input type="checkbox" v-model="itemDraft.isExtraplanar" /> Extraplanar (contents weightless)
          </label>
        </template>

        <label class="full">Description <textarea v-model="itemDraft.description" rows="4"></textarea></label>

        <div class="editor-actions">
          <button type="button" class="ghost-button" @click="itemDraft = null">Cancel</button>
          <button type="button" class="primary-button" @click="saveItem" :disabled="!itemDraft.name">Save</button>
        </div>
      </div>
    </section>

    <section v-if="tab === 'spells'" class="panel">
      <div class="section-heading">
        <div><p class="eyebrow">Arcana</p><h2>Custom Spells ({{ spells.length }})</h2></div>
        <button type="button" class="primary-button" @click="newSpell">+ New Spell</button>
      </div>
      <ul v-if="spells.length" class="hb-list">
        <li v-for="s in spells" :key="s.id" class="hb-row">
          <div class="hb-main">
            <strong>{{ s.name }}</strong>
            <small>{{ s.level === 0 ? "Cantrip" : `Lv ${s.level}` }} · {{ s.school || "—" }} · {{ componentLabel(s.components) }}{{ s.diceCount && s.diceFaces ? ` · ${s.diceCount}d${s.diceFaces}` : "" }}</small>
          </div>
          <div class="hb-actions">
            <button type="button" class="ghost-button" @click="editSpell(s)">Edit</button>
            <button type="button" class="danger-button" @click="confirmRemove(s.id, s.name)">Delete</button>
          </div>
        </li>
      </ul>
      <p v-else class="muted">No homebrew spells yet.</p>

      <div v-if="spellDraft" class="editor">
        <h3>{{ spellDraft.id ? "Edit" : "New" }} Spell</h3>
        <div class="form-grid two">
          <label>Name <input v-model="spellDraft.name" type="text" /></label>
          <label>Level
            <select v-model.number="spellDraft.level">
              <option :value="0">Cantrip</option>
              <option v-for="l in 9" :key="l" :value="l">Level {{ l }}</option>
            </select>
          </label>
          <label>School
            <select v-model="spellDraft.school">
              <option value="">—</option>
              <option v-for="s in SCHOOLS" :key="s" :value="s">{{ s }}</option>
            </select>
          </label>
          <label>Range <input v-model="spellDraft.range" type="text" placeholder="60 ft / Touch / Self" /></label>
        </div>

        <div class="comp-row">
          <span class="eyebrow">Components</span>
          <label class="check"><input type="checkbox" v-model="compV" /> V</label>
          <label class="check"><input type="checkbox" v-model="compS" /> S</label>
          <label class="check"><input type="checkbox" v-model="compM" /> M</label>
          <input v-if="compM" v-model="compMText" type="text" placeholder="material (e.g. a pinch of dust)" class="comp-mat" />
        </div>

        <div class="form-grid two">
          <label>Dice count <input v-model.number="spellDraft.diceCount" type="number" min="0" placeholder="e.g. 3" /></label>
          <label>Die faces
            <select v-model.number="spellDraft.diceFaces">
              <option :value="undefined">—</option>
              <option v-for="d in [4,6,8,10,12,20]" :key="d" :value="d">d{{ d }}</option>
            </select>
          </label>
        </div>

        <label class="full">Description <textarea v-model="spellDraft.description" rows="6"></textarea></label>

        <div class="editor-actions">
          <button type="button" class="ghost-button" @click="spellDraft = null">Cancel</button>
          <button type="button" class="primary-button" @click="saveSpell" :disabled="!spellDraft.name">Save</button>
        </div>
      </div>
    </section>

    <section v-if="tab === 'races'" class="panel">
      <div class="section-heading">
        <div><p class="eyebrow">Heritage</p><h2>Custom Races ({{ races.length }})</h2></div>
        <button type="button" class="primary-button" @click="newRace">+ New Race</button>
      </div>
      <ul v-if="races.length" class="hb-list">
        <li v-for="r in races" :key="r.id" class="hb-row">
          <div class="hb-main">
            <strong>{{ r.name }}</strong>
            <small>{{ r.size || "Medium" }} · Speed {{ r.speed || 30 }} · {{ abilityLabel(r.abilityBonuses) || "—" }}</small>
          </div>
          <div class="hb-actions">
            <button type="button" class="ghost-button" @click="editRace(r)">Edit</button>
            <button type="button" class="danger-button" @click="confirmRemove(r.id, r.name)">Delete</button>
          </div>
        </li>
      </ul>
      <p v-else class="muted">No homebrew races yet.</p>

      <div v-if="raceDraft" class="editor">
        <h3>{{ raceDraft.id ? "Edit" : "New" }} Race</h3>
        <div class="form-grid two">
          <label>Name <input v-model="raceDraft.name" type="text" /></label>
          <label>Size
            <select v-model="raceDraft.size">
              <option v-for="s in SIZES" :key="s" :value="s">{{ s }}</option>
            </select>
          </label>
          <label>Speed (ft) <input v-model.number="raceDraft.speed" type="number" min="0" placeholder="30" /></label>
        </div>
        <p class="eyebrow">Ability Bonuses</p>
        <div class="ability-grid">
          <label v-for="ab in ABILITIES" :key="ab" class="ab-bonus">
            <span>{{ ab.toUpperCase() }}</span>
            <input type="number" :value="raceDraft.abilityBonuses?.[ab] ?? 0" @input="setRaceAbility(ab, ($event.target as HTMLInputElement).valueAsNumber)" />
          </label>
        </div>
        <label class="full">Traits <textarea v-model="raceDraft.traits" rows="6" placeholder="Free-form trait description"></textarea></label>
        <div class="editor-actions">
          <button type="button" class="ghost-button" @click="raceDraft = null">Cancel</button>
          <button type="button" class="primary-button" @click="saveRace" :disabled="!raceDraft.name">Save</button>
        </div>
      </div>
    </section>

    <section v-if="tab === 'subraces'" class="panel">
      <div class="section-heading">
        <div><p class="eyebrow">Lineage</p><h2>Custom Subraces ({{ subraces.length }})</h2></div>
        <button type="button" class="primary-button" @click="newSubrace">+ New Subrace</button>
      </div>
      <ul v-if="subraces.length" class="hb-list">
        <li v-for="r in subraces" :key="r.id" class="hb-row">
          <div class="hb-main">
            <strong>{{ r.name }}</strong>
            <small>Parent: {{ parentRaceName(r.parentRaceId) }} · {{ abilityLabel(r.abilityBonuses) || "—" }}</small>
          </div>
          <div class="hb-actions">
            <button type="button" class="ghost-button" @click="editSubrace(r)">Edit</button>
            <button type="button" class="danger-button" @click="confirmRemove(r.id, r.name)">Delete</button>
          </div>
        </li>
      </ul>
      <p v-else class="muted">No homebrew subraces yet.</p>

      <div v-if="subraceDraft" class="editor">
        <h3>{{ subraceDraft.id ? "Edit" : "New" }} Subrace</h3>
        <div class="form-grid two">
          <label>Name <input v-model="subraceDraft.name" type="text" /></label>
          <label>Parent Race
            <select v-model="subraceDraft.parentRaceId">
              <option value="">—</option>
              <option v-for="r in raceChoices" :key="r.id" :value="r.id">{{ r.name }}{{ r.source ? ` (${r.source})` : "" }}</option>
            </select>
          </label>
        </div>
        <p class="eyebrow">Ability Bonuses</p>
        <div class="ability-grid">
          <label v-for="ab in ABILITIES" :key="ab" class="ab-bonus">
            <span>{{ ab.toUpperCase() }}</span>
            <input type="number" :value="subraceDraft.abilityBonuses?.[ab] ?? 0" @input="setSubraceAbility(ab, ($event.target as HTMLInputElement).valueAsNumber)" />
          </label>
        </div>
        <label class="full">Traits <textarea v-model="subraceDraft.traits" rows="5"></textarea></label>
        <div class="editor-actions">
          <button type="button" class="ghost-button" @click="subraceDraft = null">Cancel</button>
          <button type="button" class="primary-button" @click="saveSubrace" :disabled="!subraceDraft.name || !subraceDraft.parentRaceId">Save</button>
        </div>
      </div>
    </section>

    <section v-if="tab === 'classes'" class="panel">
      <div class="section-heading">
        <div><p class="eyebrow">Discipline</p><h2>Custom Classes ({{ classes.length }})</h2></div>
        <button type="button" class="primary-button" @click="newClass">+ New Class</button>
      </div>
      <ul v-if="classes.length" class="hb-list">
        <li v-for="c in classes" :key="c.id" class="hb-row">
          <div class="hb-main">
            <strong>{{ c.name }}</strong>
            <small>d{{ c.hitDieFaces }} · saves {{ c.savingThrowProficiencies.join(", ").toUpperCase() || "—" }} · {{ c.casterProgression ? `${c.casterProgression} caster` : "non-caster" }} · {{ c.features.length }} features</small>
          </div>
          <div class="hb-actions">
            <button type="button" class="ghost-button" @click="editClass(c)">Edit</button>
            <button type="button" class="danger-button" @click="confirmRemove(c.id, c.name)">Delete</button>
          </div>
        </li>
      </ul>
      <p v-else class="muted">No homebrew classes yet.</p>

      <div v-if="classDraft" class="editor">
        <h3>{{ classDraft.id ? "Edit" : "New" }} Class</h3>
        <div class="form-grid two">
          <label>Name <input v-model="classDraft.name" type="text" /></label>
          <label>Hit Die
            <select v-model.number="classDraft.hitDieFaces">
              <option v-for="d in [6,8,10,12]" :key="d" :value="d">d{{ d }}</option>
            </select>
          </label>
          <label>Casting Ability
            <select v-model="classDraft.spellcastingAbility">
              <option :value="null">None</option>
              <option v-for="a in ABILITIES" :key="a" :value="a">{{ a.toUpperCase() }}</option>
            </select>
          </label>
          <label>Caster Progression
            <select v-model="classDraft.casterProgression">
              <option :value="null">None</option>
              <option value="full">Full</option>
              <option value="1/2">Half</option>
              <option value="1/3">One-third</option>
              <option value="pact">Pact</option>
              <option value="artificer">Artificer</option>
            </select>
          </label>
          <label class="full">Prepared Spells Formula
            <input v-model="classDraft.preparedSpellsFormula" type="text" placeholder="e.g. level + cha_mod (leave blank for known caster)" />
          </label>
        </div>

        <p class="eyebrow">Saving Throw Proficiencies</p>
        <div class="check-row">
          <label v-for="ab in ABILITIES" :key="ab" class="check">
            <input type="checkbox" :checked="classDraft.savingThrowProficiencies.includes(ab)" @change="toggleSave(ab)" />
            {{ ab.toUpperCase() }}
          </label>
        </div>

        <p class="eyebrow">Cantrip Progression (per level 1–20, comma separated)</p>
        <input class="full-input" :value="(classDraft.cantripProgression ?? []).join(',')" placeholder="2,2,2,3,3,..." @change="setCantripProg(($event.target as HTMLInputElement).value)" />

        <p class="eyebrow">Spell Slot Progression (one row per level, semicolons between levels, commas between slot levels)</p>
        <textarea class="full-input" rows="4" :value="slotProgRaw" placeholder="L1=2;L2=3;L3=4,2;..." @change="setSlotProg(($event.target as HTMLTextAreaElement).value)"></textarea>

        <div class="features-head">
          <p class="eyebrow">Features</p>
          <button type="button" class="ghost-button" @click="addFeature">+ Feature</button>
        </div>
        <div v-for="(f, idx) in classDraft.features" :key="idx" class="feature-edit">
          <div class="form-grid two">
            <label>Level <input v-model.number="f.level" type="number" min="1" max="20" /></label>
            <label>Name <input v-model="f.name" type="text" /></label>
          </div>
          <textarea v-model="f.description" rows="3" placeholder="Feature text"></textarea>
          <button type="button" class="danger-button small" @click="removeFeature(idx)">Remove</button>
        </div>

        <div class="editor-actions">
          <button type="button" class="ghost-button" @click="classDraft = null">Cancel</button>
          <button type="button" class="primary-button" @click="saveClass" :disabled="!classDraft.name">Save</button>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import type { Ability } from "~/types/rules";
import type { HBSpell, HBRace, HBSubrace, HBClass, HBClassFeature, HBComponents } from "~/types/homebrew";
import type { RulesEntity, RaceData } from "~/types/rules";
import type { CustomItem, ItemType } from "~/types/items";

const tabs = [
  { key: "items" as const, label: "Items" },
  { key: "spells" as const, label: "Spells" },
  { key: "races" as const, label: "Races" },
  { key: "subraces" as const, label: "Subraces" },
  { key: "classes" as const, label: "Classes" },
];
const tab = ref<typeof tabs[number]["key"]>("items");

const SCHOOLS = ["Abjuration", "Conjuration", "Divination", "Enchantment", "Evocation", "Illusion", "Necromancy", "Transmutation"];
const SIZES = ["Tiny", "Small", "Medium", "Large", "Huge"];
const ABILITIES: Ability[] = ["str", "dex", "con", "int", "wis", "cha"];

const { spells, races, subraces, classes, load, upsert, remove } = useHomebrew();
const { items, load: loadItems, upsert: upsertItem, remove: removeItem } = useItemLibrary();
const { data: officialRaces } = useFetch<RulesEntity<RaceData>[]>("/data/races.json", { default: () => [], server: false });

onMounted(() => { load(); loadItems(); });

const raceChoices = computed(() => [
  ...races.value.map((r) => ({ id: r.id, name: r.name, source: "Homebrew" })),
  ...officialRaces.value.map((r) => ({ id: r.id, name: r.name, source: r.source })),
]);

const parentRaceName = (id: string) => raceChoices.value.find((r) => r.id === id)?.name ?? "—";

const componentLabel = (c?: HBComponents) => {
  if (!c) return "—";
  const parts = [];
  if (c.v) parts.push("V");
  if (c.s) parts.push("S");
  if (c.m) parts.push("M");
  return parts.join(", ") || "—";
};
const abilityLabel = (b?: Partial<Record<Ability, number>>) => {
  if (!b) return "";
  return Object.entries(b).filter(([_, v]) => v).map(([k, v]) => `${k.toUpperCase()} ${v! >= 0 ? "+" : ""}${v}`).join(", ");
};

const newId = (kind: string) => `hb:${kind}:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 6)}`;

const confirmRemove = (id: string, name: string) => {
  if (confirm(`Delete "${name}"? Cannot be undone.`)) remove(id);
};

const itemDraft = ref<CustomItem | null>(null);
const newItem = () => {
  itemDraft.value = {
    id: "", name: "", type: "misc", createdAt: new Date().toISOString(),
  };
};
const editItem = (it: CustomItem) => { itemDraft.value = JSON.parse(JSON.stringify(it)); };
const saveItem = () => {
  if (!itemDraft.value || !itemDraft.value.name) return;
  const id = itemDraft.value.id || newId("item");
  upsertItem({ ...itemDraft.value, id });
  itemDraft.value = null;
};
const confirmRemoveItem = (id: string, name: string) => {
  if (confirm(`Delete "${name}"? Cannot be undone.`)) removeItem(id);
};

const spellDraft = ref<HBSpell | null>(null);
const compV = computed({ get: () => !!spellDraft.value?.components?.v, set: (v) => spellDraft.value && (spellDraft.value.components = { ...spellDraft.value.components, v }) });
const compS = computed({ get: () => !!spellDraft.value?.components?.s, set: (v) => spellDraft.value && (spellDraft.value.components = { ...spellDraft.value.components, s: v }) });
const compM = computed({
  get: () => !!spellDraft.value?.components?.m,
  set: (v) => spellDraft.value && (spellDraft.value.components = { ...spellDraft.value.components, m: v ? (typeof spellDraft.value.components.m === "string" ? spellDraft.value.components.m : true) : false }),
});
const compMText = computed({
  get: () => typeof spellDraft.value?.components?.m === "string" ? spellDraft.value.components.m : "",
  set: (v) => spellDraft.value && (spellDraft.value.components = { ...spellDraft.value.components, m: v || true }),
});

const newSpell = () => {
  spellDraft.value = {
    id: "", kind: "spell", name: "", level: 0, school: "", range: "",
    components: {}, description: "", createdAt: new Date().toISOString(),
  };
};
const editSpell = (s: HBSpell) => { spellDraft.value = JSON.parse(JSON.stringify(s)); };
const saveSpell = () => {
  if (!spellDraft.value) return;
  const draft = { ...spellDraft.value, id: spellDraft.value.id || newId("spell") };
  upsert(draft);
  spellDraft.value = null;
};

const raceDraft = ref<HBRace | null>(null);
const newRace = () => {
  raceDraft.value = { id: "", kind: "race", name: "", size: "Medium", speed: 30, abilityBonuses: {}, traits: "", createdAt: new Date().toISOString() };
};
const editRace = (r: HBRace) => { raceDraft.value = JSON.parse(JSON.stringify(r)); };
const setRaceAbility = (ab: Ability, val: number) => {
  if (!raceDraft.value) return;
  raceDraft.value.abilityBonuses = { ...(raceDraft.value.abilityBonuses ?? {}), [ab]: Number.isFinite(val) ? val : 0 };
};
const saveRace = () => {
  if (!raceDraft.value) return;
  upsert({ ...raceDraft.value, id: raceDraft.value.id || newId("race") });
  raceDraft.value = null;
};

const subraceDraft = ref<HBSubrace | null>(null);
const newSubrace = () => {
  subraceDraft.value = { id: "", kind: "subrace", name: "", parentRaceId: "", abilityBonuses: {}, traits: "", createdAt: new Date().toISOString() };
};
const editSubrace = (r: HBSubrace) => { subraceDraft.value = JSON.parse(JSON.stringify(r)); };
const setSubraceAbility = (ab: Ability, val: number) => {
  if (!subraceDraft.value) return;
  subraceDraft.value.abilityBonuses = { ...(subraceDraft.value.abilityBonuses ?? {}), [ab]: Number.isFinite(val) ? val : 0 };
};
const saveSubrace = () => {
  if (!subraceDraft.value) return;
  upsert({ ...subraceDraft.value, id: subraceDraft.value.id || newId("subrace") });
  subraceDraft.value = null;
};

const classDraft = ref<HBClass | null>(null);
const newClass = () => {
  classDraft.value = {
    id: "", kind: "class", name: "", hitDieFaces: 8,
    savingThrowProficiencies: [], spellcastingAbility: null, casterProgression: null,
    preparedSpellsFormula: "", cantripProgression: [], spellSlotProgression: [],
    features: [], createdAt: new Date().toISOString(),
  };
};
const editClass = (c: HBClass) => { classDraft.value = JSON.parse(JSON.stringify(c)); };
const toggleSave = (ab: Ability) => {
  if (!classDraft.value) return;
  const set = new Set(classDraft.value.savingThrowProficiencies);
  if (set.has(ab)) set.delete(ab); else set.add(ab);
  classDraft.value.savingThrowProficiencies = [...set];
};
const setCantripProg = (raw: string) => {
  if (!classDraft.value) return;
  classDraft.value.cantripProgression = raw.split(",").map((s) => parseInt(s.trim(), 10)).filter(Number.isFinite);
};
const slotProgRaw = computed(() =>
  (classDraft.value?.spellSlotProgression ?? []).map((row, i) => `L${i + 1}=${row.join(",")}`).join(";\n"),
);
const setSlotProg = (raw: string) => {
  if (!classDraft.value) return;
  const rows: number[][] = [];
  raw.split(/[;\n]+/).forEach((line) => {
    const m = line.match(/L\d+=([\d, ]+)/);
    if (m && m[1]) rows.push(m[1].split(",").map((s) => parseInt(s.trim(), 10)).filter(Number.isFinite));
  });
  classDraft.value.spellSlotProgression = rows;
};
const addFeature = () => {
  if (!classDraft.value) return;
  classDraft.value.features = [...classDraft.value.features, { level: 1, name: "", description: "" }];
};
const removeFeature = (idx: number) => {
  if (!classDraft.value) return;
  classDraft.value.features = classDraft.value.features.filter((_, i) => i !== idx);
};
const saveClass = () => {
  if (!classDraft.value) return;
  upsert({ ...classDraft.value, id: classDraft.value.id || newId("class") });
  classDraft.value = null;
};
</script>

<style scoped>
.tabs { display: flex; gap: 6px; margin-bottom: 14px; }
.tabs button { flex: 1; min-height: 38px; background: transparent; border-color: var(--line); color: var(--ink-soft); }
.tabs button.active { background: var(--bg-panel-2); border-color: var(--gilt); color: var(--gilt); }

.hb-list { list-style: none; margin: 0 0 14px; padding: 0; display: grid; gap: 8px; }
.hb-row { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 10px 14px; border: 1px solid var(--line); border-radius: 4px; background: var(--bg-soft); }
.hb-main { display: grid; gap: 2px; }
.hb-main strong { font-family: "IM Fell English", serif; font-weight: 400; font-size: 1.1rem; }
.hb-main small { color: var(--ink-faint); font-style: italic; }
.hb-actions { display: flex; gap: 6px; }

.editor { margin-top: 16px; padding: 16px; border: 1px dashed var(--gilt); border-radius: 4px; background: rgba(201, 161, 85, 0.04); display: grid; gap: 12px; }
.editor h3 { margin: 0; font-family: "IM Fell English", serif; font-weight: 400; }

.form-grid.two { display: grid; gap: 10px; grid-template-columns: 1fr; }
@media (min-width: 520px) { .form-grid.two { grid-template-columns: 1fr 1fr; } }
.form-grid.two .full { grid-column: 1 / -1; }
.full { display: grid; }

.comp-row { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; padding: 8px 12px; border: 1px solid var(--line); border-radius: 4px; background: var(--bg-soft); }
.comp-row .check { display: flex; align-items: center; gap: 6px; }
.comp-mat { flex: 1; min-width: 200px; }

.ability-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px; }
.ab-bonus { display: grid; gap: 4px; padding: 6px; border: 1px solid var(--line); border-radius: 4px; background: var(--bg-soft); text-align: center; }
.ab-bonus span { font-family: "IM Fell English SC", serif; font-size: 0.7rem; letter-spacing: 0.14em; color: var(--gilt); }
.ab-bonus input { border: none; background: transparent; text-align: center; font-family: "IM Fell English", serif; font-size: 1.1rem; padding: 0; min-height: auto; }

.check-row { display: flex; flex-wrap: wrap; gap: 10px; }
.check { display: flex; align-items: center; gap: 6px; padding: 4px 10px; border: 1px solid var(--line); border-radius: 4px; background: var(--bg-soft); }

.full-input { width: 100%; padding: 8px; font-family: "EB Garamond", serif; }

.features-head { display: flex; justify-content: space-between; align-items: center; }
.feature-edit { padding: 12px; border: 1px solid var(--line); border-radius: 4px; background: var(--bg); display: grid; gap: 8px; }
.danger-button.small { justify-self: flex-start; min-height: 30px; padding: 0 10px; font-size: 0.78rem; }

.editor-actions { display: flex; justify-content: flex-end; gap: 8px; }
</style>
