<template>
  <Teleport to="body">
    <div v-if="open" class="modal-backdrop" @click.self="$emit('close')">
      <div class="modal" role="dialog" aria-label="Character image">
        <header class="modal-head">
          <h2>Character Image</h2>
          <button type="button" class="modal-close" @click="$emit('close')" aria-label="Close">×</button>
        </header>
        <div class="modal-body">
          <div v-if="preview" class="preview"><img :src="preview" alt="Preview" /></div>
          <p v-else class="muted">No image yet.</p>

          <label>Image URL
            <input v-model="urlInput" type="url" placeholder="https://..." @input="onUrlInput" />
          </label>

          <label>Or upload file
            <input ref="fileEl" type="file" accept="image/*" @change="onFile" />
          </label>
          <p class="muted small">Uploaded files are embedded as data URLs in the character JSON, so they travel with shares/exports.</p>

          <div class="actions">
            <button type="button" class="danger-button" v-if="preview" @click="clearImage">Remove</button>
            <button type="button" class="ghost-button" @click="$emit('close')">Cancel</button>
            <button type="button" class="primary-button" :disabled="!preview" @click="save">Save</button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const props = defineProps<{ open: boolean; modelValue?: string }>();
const emit = defineEmits<{ (e: "close"): void; (e: "update", v: string | undefined): void }>();

const urlInput = ref("");
const dataUrl = ref<string | undefined>(undefined);
const fileEl = ref<HTMLInputElement | null>(null);

const preview = computed(() => dataUrl.value || urlInput.value || "");

watch(() => props.open, (v) => {
  if (v) {
    urlInput.value = props.modelValue?.startsWith("data:") ? "" : (props.modelValue ?? "");
    dataUrl.value = props.modelValue?.startsWith("data:") ? props.modelValue : undefined;
  }
});

const onUrlInput = () => { dataUrl.value = undefined; if (fileEl.value) fileEl.value.value = ""; };

const onFile = (e: Event) => {
  const f = (e.target as HTMLInputElement).files?.[0];
  if (!f) return;
  if (f.size > 2_500_000) { alert("Image too large (max ~2.5 MB)."); return; }
  const reader = new FileReader();
  reader.onload = () => { dataUrl.value = String(reader.result); urlInput.value = ""; };
  reader.readAsDataURL(f);
};

const save = () => {
  emit("update", preview.value || undefined);
  emit("close");
};

const clearImage = () => {
  emit("update", undefined);
  urlInput.value = "";
  dataUrl.value = undefined;
  if (fileEl.value) fileEl.value.value = "";
  emit("close");
};
</script>

<style scoped>
.modal-backdrop { position: fixed; inset: 0; z-index: 1000; background: rgba(0,0,0,0.7); display: grid; place-items: center; padding: 16px; overflow-y: auto; }
@media (max-width: 520px) { .modal-backdrop { padding: 8px; } }
.modal { width: min(480px, 100%); max-height: 90dvh; overflow-y: auto; background: var(--bg-panel-2, var(--bg-soft)); border: 1px solid var(--gilt); border-radius: 6px; }
.modal-head { display: flex; justify-content: space-between; padding: 14px 18px; border-bottom: 1px solid var(--line); }
.modal-head h2 { margin: 0; font-family: "IM Fell English", serif; font-weight: 400; font-size: 1.2rem; }
.modal-close { background: transparent; border: none; color: var(--ink-faint); font-size: 1.5rem; cursor: pointer; }
.modal-body { padding: 14px 18px; display: grid; gap: 12px; }
.preview { display: grid; place-items: center; padding: 8px; border: 1px solid var(--line); border-radius: 4px; background: var(--bg-soft); }
.preview img { max-width: 100%; max-height: 240px; border-radius: 4px; }
.actions { display: flex; gap: 8px; justify-content: flex-end; flex-wrap: wrap; }
.muted { color: var(--ink-faint); font-style: italic; margin: 0; }
.muted.small { font-size: 0.78rem; }
input[type="file"] { padding: 6px; }
</style>
