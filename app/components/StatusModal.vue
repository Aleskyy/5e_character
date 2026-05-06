<template>
  <Teleport to="body">
    <div v-if="open" class="modal-backdrop" @click.self="$emit('close')">
      <div class="modal" role="dialog" aria-label="Status conditions">
        <header class="modal-head">
          <div>
            <p class="eyebrow">Conditions</p>
            <h2>{{ name }}</h2>
          </div>
          <button type="button" class="modal-close" @click="$emit('close')" aria-label="Close">×</button>
        </header>
        <div class="modal-body">
          <ul class="cond-grid">
            <li v-for="c in SRD_CONDITIONS" :key="c">
              <label>
                <input type="checkbox" :checked="active(c)" @change="toggle(c)" />
                <span>{{ c }}</span>
              </label>
            </li>
          </ul>
          <div class="exh">
            <label>
              <span class="eyebrow">Exhaustion</span>
              <input type="number" min="0" max="6" :value="exhaustion" @input="setExh(($event.target as HTMLInputElement).valueAsNumber)" />
            </label>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { SRD_CONDITIONS } from "~/utils/conditions";

const props = defineProps<{
  open: boolean;
  name: string;
  conditions: string[];
  exhaustion: number;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "update", payload: { conditions: string[]; exhaustion: number }): void;
}>();

const active = (c: string) => props.conditions.includes(c);
const toggle = (c: string) => {
  const next = active(c) ? props.conditions.filter((x) => x !== c) : [...props.conditions, c];
  emit("update", { conditions: next, exhaustion: props.exhaustion });
};
const setExh = (n: number) => {
  const v = Number.isFinite(n) ? Math.max(0, Math.min(6, n)) : 0;
  emit("update", { conditions: props.conditions, exhaustion: v });
};
</script>

<style scoped>
.modal-backdrop { position: fixed; inset: 0; z-index: 1000; background: rgba(0,0,0,0.7); display: grid; place-items: center; padding: 16px; overflow-y: auto; }
.modal { width: min(520px, 100%); max-height: 85vh; overflow-y: auto; background: var(--bg-panel-2, var(--bg-soft)); border: 1px solid var(--gilt); border-radius: 6px; }
.modal-head { display: flex; justify-content: space-between; align-items: flex-start; padding: 14px 18px; border-bottom: 1px solid var(--line); }
.modal-close { background: transparent; border: none; color: var(--ink-faint); font-size: 1.5rem; cursor: pointer; }
.modal-body { padding: 14px 18px; display: grid; gap: 16px; }
.cond-grid { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 4px; }
.cond-grid label { display: grid; grid-template-columns: 16px 1fr; gap: 8px; align-items: center; padding: 5px 10px; border: 1px solid var(--line); border-radius: 4px; background: var(--bg-soft); cursor: pointer; text-transform: capitalize; font-size: 0.85rem; }
.cond-grid input[type="checkbox"] { width: 14px; height: 14px; margin: 0; justify-self: center; }
.exh label { display: flex; gap: 12px; align-items: center; }
.exh input { width: 70px; }
</style>
