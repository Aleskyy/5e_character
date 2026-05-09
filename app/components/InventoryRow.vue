<template>
  <div class="inv-row" :class="{ container: item?.isContainer }">
    <span class="inv-name">
      {{ item?.name ?? "Unknown" }}
      <small v-if="item?.type === 'weapon' && item?.damage">({{ item.damage }} {{ item.damageType }})</small>
      <small v-else-if="item?.isContainer">{{ item.isExtraplanar ? "extraplanar" : "container" }}</small>
    </span>
    <input
      type="number"
      class="qty"
      min="1"
      :value="entry.quantity"
      @input="emitUpdate({ quantity: Math.max(1, Number(($event.target as HTMLInputElement).value) || 1) })"
    />
    <label class="equip" v-if="item?.type === 'weapon' || item?.type === 'armor'">
      <input type="checkbox" :checked="entry.equipped ?? false" @change="emitUpdate({ equipped: ($event.target as HTMLInputElement).checked })" />
      <span>Eq</span>
    </label>
    <select
      v-if="containers.length && !item?.isContainer"
      class="container-select"
      :value="entry.containerId ?? ''"
      @change="emitUpdate({ containerId: ($event.target as HTMLSelectElement).value || null })"
    >
      <option value="">Pack</option>
      <option v-for="c in containers" :key="c.id" :value="c.id" :disabled="c.id === entry.id">
        In {{ containerName(c.itemId) }}
      </option>
    </select>
    <button type="button" class="ghost-button" @click="$emit('remove', entry.id)">×</button>
  </div>
</template>

<script setup lang="ts">
import type { InventoryEntry } from "~/types/character";
import type { CustomItem } from "~/types/items";

const props = defineProps<{
  entry: InventoryEntry;
  item: CustomItem | undefined;
  containers: InventoryEntry[];
}>();
const emit = defineEmits<{ (e: "update", v: InventoryEntry): void; (e: "remove", id: string): void }>();

const { findById } = useItemLibrary();
const containerName = (itemId: string) => findById(itemId)?.name ?? "container";

const emitUpdate = (patch: Partial<InventoryEntry>) => {
  emit("update", { ...props.entry, ...patch });
};
</script>

<style scoped>
.inv-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 60px auto auto auto;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid var(--line-soft);
  border-radius: 4px;
  background: var(--bg-soft);
  min-width: 0;
}

.inv-row.container { border-color: var(--gilt-soft); background: rgba(201, 161, 85, 0.06); }

.inv-name { font-family: "EB Garamond", serif; min-width: 0; overflow-wrap: anywhere; word-break: break-word; }
.inv-name small { color: var(--ink-faint); font-style: italic; margin-left: 6px; font-size: 0.86rem; }

.qty { min-height: 32px; padding: 4px 6px; text-align: center; min-width: 0; }

.equip { flex-direction: row; align-items: center; gap: 4px; text-transform: none; letter-spacing: 0; font-size: 0.78rem; }
.equip input { width: 16px; min-height: 16px; }

.container-select { min-height: 32px; padding: 4px 6px; max-width: 140px; min-width: 0; }

button.ghost-button {
  width: 30px; height: 30px; min-height: auto; padding: 0;
  font-size: 1.1rem;
}

@media (max-width: 520px) {
  .inv-row { grid-template-columns: minmax(0, 1fr) auto; }
  .qty, .equip, .container-select { grid-column: 1 / -1; max-width: none; width: 100%; }
}
</style>
