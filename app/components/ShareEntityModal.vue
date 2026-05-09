<template>
  <Teleport to="body">
    <div v-if="open" class="modal-backdrop" @click.self="$emit('close')">
      <div class="modal" role="dialog" aria-label="Share entity">
        <header class="modal-head">
          <div>
            <p class="eyebrow">{{ kindLabel }}</p>
            <h2>{{ title }}</h2>
          </div>
          <button type="button" class="modal-close" @click="$emit('close')" aria-label="Close">×</button>
        </header>
        <div class="modal-body">
          <div v-if="entity" class="block">
            <p class="eyebrow">Compact Code <small class="muted">({{ code.length }} chars)</small></p>
            <textarea readonly :value="code" class="code-area" rows="4" @click="selectAll($event)"></textarea>
            <div class="row">
              <button type="button" class="ghost-button" @click="copy(code)">Copy code</button>
              <button type="button" class="ghost-button" @click="copy(json)">Copy JSON</button>
              <button type="button" class="ghost-button" @click="downloadJson">Download .json</button>
              <span v-if="status" class="muted">{{ status }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { encodeShareCode } from "~/utils/share-code";

const props = defineProps<{
  open: boolean;
  entity?: unknown;
  title?: string;
  kindLabel?: string;
}>();

defineEmits<{ (e: "close"): void }>();

const code = ref("");
const json = ref("");
const status = ref("");

watch(() => [props.open, props.entity] as const, async ([open, ent]) => {
  if (!open || !ent) { code.value = ""; json.value = ""; return; }
  json.value = JSON.stringify(ent, null, 2);
  try { code.value = await encodeShareCode(ent); }
  catch (err) { code.value = ""; status.value = `Encode failed: ${(err as Error).message}`; }
}, { immediate: true });

const selectAll = (e: Event) => (e.target as HTMLTextAreaElement).select();
const copy = async (txt: string) => {
  if (!txt) return;
  try { await navigator.clipboard.writeText(txt); status.value = "Copied"; }
  catch { status.value = "Copy failed"; }
};
const downloadJson = () => {
  if (!props.entity) return;
  const name = (props.entity as { name?: string }).name ?? "entity";
  const blob = new Blob([json.value], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${name}.json`;
  link.click();
  URL.revokeObjectURL(url);
};
</script>

<style scoped>
.modal-backdrop { position: fixed; inset: 0; z-index: 1000; background: rgba(0,0,0,0.7); display: grid; place-items: center; padding: 16px; overflow-y: auto; }
@media (max-width: 520px) { .modal-backdrop { padding: 8px; } }
.modal { width: min(640px, 100%); max-height: 90dvh; overflow-y: auto; background: var(--bg-panel-2, var(--bg-soft)); border: 1px solid var(--gilt); border-radius: 6px; }
.modal-head { display: flex; justify-content: space-between; padding: 14px 18px; border-bottom: 1px solid var(--line); }
.modal-close { background: transparent; border: none; color: var(--ink-faint); font-size: 1.5rem; cursor: pointer; }
.modal-body { padding: 14px 18px; display: grid; gap: 14px; }
.code-area { width: 100%; font-family: monospace; font-size: 0.78rem; word-break: break-all; resize: vertical; }
.row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.muted { font-size: 0.78rem; }
</style>
