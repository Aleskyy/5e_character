<template>
  <section class="panel">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Pack</p>
        <h2>Inventory</h2>
      </div>
      <button type="button" class="ghost-button" @click="creating = !creating">{{ creating ? "Cancel" : "+ Custom Item" }}</button>
    </div>

    <form v-if="creating" class="creator" @submit.prevent="createItem">
      <div class="creator-grid">
        <label>Name <input v-model="form.name" type="text" required /></label>
        <label>
          Type
          <select v-model="form.type">
            <option value="weapon">Weapon</option>
            <option value="armor">Armor</option>
            <option value="container">Container</option>
            <option value="consumable">Consumable</option>
            <option value="misc">Misc</option>
          </select>
        </label>
        <template v-if="form.type === 'weapon'">
          <label>
            Damage Ability
            <select v-model="form.damageAbility">
              <option v-for="a in abilities" :key="a" :value="a">{{ a.toUpperCase() }}</option>
            </select>
          </label>
          <label>Damage Die
            <input v-model="form.damage" type="text" list="damage-dice" placeholder="1d8" />
            <datalist id="damage-dice">
              <option value="1d4" />
              <option value="1d6" />
              <option value="1d8" />
              <option value="1d10" />
              <option value="1d12" />
              <option value="2d4" />
              <option value="2d6" />
              <option value="2d8" />
              <option value="2d10" />
              <option value="3d6" />
            </datalist>
          </label>
          <label>Damage Type <input v-model="form.damageType" type="text" placeholder="slashing" /></label>
        </template>
        <template v-if="form.type === 'container'">
          <label class="row-checkbox">
            <input v-model="form.isExtraplanar" type="checkbox" />
            <span>Extraplanar (Bag of Holding-style)</span>
          </label>
        </template>
        <label v-if="form.type === 'armor' || form.type === 'misc'">AC Bonus <input v-model.number="form.acBonus" type="number" placeholder="e.g. 6" /></label>
        <label>Weight <input v-model.number="form.weight" type="number" min="0" step="0.1" /></label>
        <label class="full">Description <textarea v-model="form.description" rows="2"></textarea></label>
      </div>
      <button type="submit" class="primary-button">Save to Library</button>
    </form>

    <div class="inv-controls">
      <select v-model="addItemId">
        <option value="">Add from library…</option>
        <optgroup v-for="(group, type) in groupedLibrary" :key="type" :label="String(type)">
          <option v-for="it in group" :key="it.id" :value="it.id">{{ it.name }}</option>
        </optgroup>
      </select>
      <button type="button" :disabled="!addItemId" @click="addToInventory">Add</button>
    </div>

    <ul v-if="rootEntries.length" class="inv-list">
      <li v-for="entry in rootEntries" :key="entry.id">
        <InventoryRow
          :entry="entry"
          :item="resolveItem(entry.itemId)"
          :containers="containerEntries"
          @update="updateEntry"
          @remove="removeEntry"
        />
        <ul v-if="containerOf(entry.id).length" class="inv-children">
          <li v-for="child in containerOf(entry.id)" :key="child.id">
            <InventoryRow
              :entry="child"
              :item="resolveItem(child.itemId)"
              :containers="containerEntries"
              @update="updateEntry"
              @remove="removeEntry"
            />
          </li>
        </ul>
      </li>
    </ul>
    <p v-else class="muted">Pack is empty.</p>
  </section>
</template>

<script setup lang="ts">
import type { CharacterDraft, InventoryEntry } from "~/types/character";
import type { CustomItem, ItemType } from "~/types/items";
import type { Ability } from "~/types/rules";
import { abilities } from "~/utils/character";

const props = defineProps<{ character: CharacterDraft }>();

const { items: library, load: loadLibrary, upsert } = useItemLibrary();
onMounted(() => loadLibrary());

const creating = ref(false);
const addItemId = ref("");

type Form = {
  name: string;
  type: ItemType;
  damageAbility?: Ability;
  damage?: string;
  damageType?: string;
  weight?: number;
  acBonus?: number;
  isExtraplanar?: boolean;
  description?: string;
};

const blankForm = (): Form => ({ name: "", type: "misc", damageAbility: "str" });
const form = reactive<Form>(blankForm());

const createItem = () => {
  const item: CustomItem = {
    id: crypto.randomUUID(),
    name: form.name.trim(),
    type: form.type,
    damageAbility: form.type === "weapon" ? form.damageAbility : undefined,
    damage: form.type === "weapon" ? form.damage : undefined,
    damageType: form.type === "weapon" ? form.damageType : undefined,
    weight: form.weight,
    acBonus: form.acBonus,
    isContainer: form.type === "container",
    isExtraplanar: form.type === "container" ? form.isExtraplanar : undefined,
    description: form.description,
    createdAt: new Date().toISOString(),
  };
  if (!item.name) return;
  upsert(item);
  Object.assign(form, blankForm());
  creating.value = false;
};

const groupedLibrary = computed(() => {
  const groups: Record<string, CustomItem[]> = {};
  for (const item of library.value) {
    const key = item.type;
    (groups[key] ??= []).push(item);
  }
  return groups;
});

const inventory = computed(() => props.character.inventory ?? []);
const rootEntries = computed(() => inventory.value.filter((e) => !e.containerId));
const containerEntries = computed(() =>
  inventory.value.filter((e) => resolveItem(e.itemId)?.isContainer),
);
const containerOf = (entryId: string) =>
  inventory.value.filter((e) => e.containerId === entryId);

const resolveItem = (id: string) => library.value.find((i) => i.id === id);

const addToInventory = () => {
  if (!addItemId.value) return;
  const entry: InventoryEntry = {
    id: crypto.randomUUID(),
    itemId: addItemId.value,
    quantity: 1,
    equipped: false,
    containerId: null,
  };
  props.character.inventory = [...inventory.value, entry];
  addItemId.value = "";
};

const updateEntry = (next: InventoryEntry) => {
  props.character.inventory = inventory.value.map((e) => e.id === next.id ? next : e);
};

const removeEntry = (id: string) => {
  props.character.inventory = inventory.value.filter((e) => e.id !== id && e.containerId !== id);
};
</script>

<style scoped>
.creator {
  padding: 12px;
  border: 1px dashed var(--gilt);
  border-radius: 4px;
  background: rgba(201, 161, 85, 0.05);
  margin-bottom: 14px;
}

.creator-grid {
  display: grid;
  gap: 10px;
  margin-bottom: 12px;
}
@media (min-width: 600px) {
  .creator-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .creator-grid .full { grid-column: 1 / -1; }
}

.row-checkbox {
  flex-direction: row;
  align-items: center;
  gap: 8px;
  text-transform: none;
  letter-spacing: 0;
}
.row-checkbox input { width: 18px; min-height: 18px; }

.inv-controls {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.inv-controls select { flex: 1; }

.inv-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; min-width: 0; }
.inv-list > li { min-width: 0; }
.inv-children {
  list-style: none;
  margin: 6px 0 0 18px;
  padding: 6px 0 6px 12px;
  border-left: 2px solid var(--gilt-soft);
  display: grid;
  gap: 6px;
  min-width: 0;
}
.inv-children > li { min-width: 0; }
@media (max-width: 520px) {
  .inv-children { margin-left: 8px; padding-left: 8px; }
  .inv-controls { flex-wrap: wrap; }
  .inv-controls select { flex: 1 1 100%; min-width: 0; }
}

textarea { resize: vertical; font-family: "EB Garamond", serif; }
</style>
