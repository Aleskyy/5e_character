<template>
  <div class="chips">
    <span v-for="(value, idx) in modelValue" :key="value + idx" class="chip">
      {{ value }}
      <button type="button" class="chip-remove" :aria-label="`Remove ${value}`" @click="remove(idx)">×</button>
    </span>
    <input
      v-model="draft"
      type="text"
      class="chip-input"
      :placeholder="placeholder"
      :list="datalistId"
      @keydown.enter.prevent="commit"
      @keydown.,.prevent="commit"
      @blur="commit"
    />
    <datalist v-if="suggestions?.length" :id="datalistId">
      <option v-for="s in suggestions" :key="s" :value="s" />
    </datalist>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: string[];
  placeholder?: string;
  suggestions?: string[];
}>();
const emit = defineEmits<{ (e: "update:modelValue", v: string[]): void }>();

const draft = ref("");
const datalistId = `dl-${Math.random().toString(36).slice(2, 8)}`;

const commit = () => {
  const v = draft.value.trim();
  if (!v) return;
  if (props.modelValue.includes(v)) { draft.value = ""; return; }
  emit("update:modelValue", [...props.modelValue, v]);
  draft.value = "";
};

const remove = (idx: number) => {
  emit("update:modelValue", props.modelValue.filter((_, i) => i !== idx));
};
</script>

<style scoped>
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px;
  border: 1px solid var(--line);
  border-radius: 4px;
  background: var(--bg-soft);
}

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
}
.chip-remove:hover { color: var(--rubric); background: transparent; }

.chip-input {
  flex: 1;
  min-width: 120px;
  min-height: 30px;
  padding: 4px 8px;
  border: none;
  background: transparent;
  font-size: 0.95rem;
}
.chip-input:focus { box-shadow: none; }
</style>
