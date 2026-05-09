<template>
  <Teleport to="body">
    <div v-if="open" class="modal-backdrop" @click.self="$emit('close')">
      <div class="modal" role="dialog" aria-label="Share character">
        <header class="modal-head">
          <div>
            <p class="eyebrow">Export / Import</p>
            <h2>Share Character</h2>
          </div>
          <button type="button" class="modal-close" @click="$emit('close')" aria-label="Close">×</button>
        </header>
        <div class="modal-body">
          <div v-if="character" class="block">
            <p class="eyebrow">Compact Code <small class="muted">({{ code.length }} chars)</small></p>
            <textarea readonly :value="code" class="code-area" rows="5" @click="selectAll($event)"></textarea>
            <div class="row">
              <button type="button" class="ghost-button" @click="copy(code)">Copy code</button>
              <button type="button" class="ghost-button" @click="copy(json)">Copy JSON</button>
              <button type="button" class="ghost-button" @click="downloadJson">Download .json</button>
            </div>
          </div>

          <div class="block">
            <p class="eyebrow">Import (paste code or JSON)</p>
            <textarea v-model="importInput" class="code-area" rows="5" placeholder="Paste 5EC1:... or { ... }"></textarea>
            <div class="row">
              <button type="button" class="primary-button" :disabled="!importInput.trim() || busy" @click="doImport">{{ busy ? "Working…" : "Import" }}</button>
              <span v-if="status" class="muted">{{ status }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { CharacterDraft } from "~/types/character";
import { encodeShareCode, decodeShare } from "~/utils/share-code";

const props = defineProps<{
  open: boolean;
  character?: CharacterDraft | null;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "import", payload: CharacterDraft): void;
}>();

const code = ref("");
const json = ref("");
const importInput = ref("");
const status = ref("");
const busy = ref(false);

watch(() => [props.open, props.character] as const, async ([open, ch]) => {
  if (!open || !ch) { code.value = ""; json.value = ""; return; }
  json.value = JSON.stringify(ch, null, 2);
  try { code.value = await encodeShareCode(ch); }
  catch (err) { code.value = ""; status.value = `Encode failed: ${(err as Error).message}`; }
}, { immediate: true });

const selectAll = (e: Event) => (e.target as HTMLTextAreaElement).select();

const copy = async (txt: string) => {
  if (!txt) return;
  try { await navigator.clipboard.writeText(txt); status.value = "Copied"; }
  catch { status.value = "Copy failed — select and copy manually"; }
};

const downloadJson = () => {
  if (!props.character) return;
  const blob = new Blob([json.value], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${props.character.name || "character"}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

const doImport = async () => {
  busy.value = true;
  status.value = "";
  try {
    const parsed = await decodeShare<CharacterDraft>(importInput.value);
    if (!parsed || typeof parsed !== "object") throw new Error("Invalid payload");
    emit("import", parsed);
    importInput.value = "";
    status.value = "Imported";
  } catch (err) {
    status.value = `Import failed: ${(err as Error).message}`;
  } finally {
    busy.value = false;
  }
};
</script>

<style scoped>
.modal-backdrop { position: fixed; inset: 0; z-index: 1000; background: rgba(0,0,0,0.7); display: grid; place-items: center; padding: 16px; overflow-y: auto; }
@media (max-width: 520px) { .modal-backdrop { padding: 8px; } }
.modal { width: min(640px, 100%); max-height: 90dvh; overflow-y: auto; background: var(--bg-panel-2, var(--bg-soft)); border: 1px solid var(--gilt); border-radius: 6px; }
.modal-head { display: flex; justify-content: space-between; padding: 14px 18px; border-bottom: 1px solid var(--line); }
.modal-close { background: transparent; border: none; color: var(--ink-faint); font-size: 1.5rem; cursor: pointer; }
.modal-body { padding: 14px 18px; display: grid; gap: 16px; }
.block { display: grid; gap: 8px; }
.code-area { width: 100%; font-family: monospace; font-size: 0.78rem; word-break: break-all; resize: vertical; }
.row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.muted { font-size: 0.78rem; }
</style>
