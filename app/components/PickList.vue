<template>
  <div class="picklist">
    <select class="pick-select" :value="''" @change="onPick(($event.target as HTMLSelectElement).value)">
      <option value="">{{ placeholder ?? "Add…" }}</option>
      <option v-for="opt in available" :key="opt" :value="opt">{{ opt }}</option>
    </select>
    <div v-if="modelValue.length" class="chips">
      <span v-for="(value, idx) in modelValue" :key="value + idx" class="chip">
        {{ value }}
        <button type="button" class="chip-remove" :aria-label="`Remove ${value}`" @click="remove(idx)">×</button>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: string[];
  options: string[];
  placeholder?: string;
}>();
const emit = defineEmits<{ (e: "update:modelValue", v: string[]): void }>();

const available = computed(() => props.options.filter((o) => !props.modelValue.includes(o)));

const onPick = (v: string) => {
  if (!v) return;
  emit("update:modelValue", [...props.modelValue, v]);
};

const remove = (idx: number) => {
  emit("update:modelValue", props.modelValue.filter((_, i) => i !== idx));
};
</script>

<style scoped>
.picklist { display: grid; gap: 8px; }
.pick-select {
  width: 100%;
  min-height: 38px;
  padding: 6px 10px;
  border: 1px solid var(--line);
  border-radius: 4px;
  background: var(--bg-soft);
  font-family: "EB Garamond", serif;
  font-size: 0.95rem;
  color: var(--ink);
}
.pick-select:focus { outline: none; border-color: var(--gilt); }

.chips { display: flex; flex-wrap: wrap; gap: 6px; }
.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border: 1px solid var(--gilt-soft);
  border-radius: 999px;
  background: rgba(201, 161, 85, 0.08);
  font-family: "EB Garamond", serif;
  font-size: 0.92rem;
  color: var(--ink);
}
.chip-remove {
  width: 18px;
  height: 18px;
  min-height: auto;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--ink-faint);
  font-size: 1rem;
  line-height: 1;
  cursor: pointer;
}
.chip-remove:hover { color: var(--rubric); }
</style>
