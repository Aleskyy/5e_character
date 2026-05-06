<template>
  <Teleport to="body">
    <div v-if="open" class="modal-backdrop" @click.self="cancel">
      <div class="modal" role="alertdialog" :aria-label="title">
        <header class="modal-head">
          <p class="eyebrow">{{ tone === 'danger' ? 'Confirm' : 'Question' }}</p>
          <h2>{{ title }}</h2>
        </header>
        <div class="modal-body">
          <p v-if="message" class="msg">{{ message }}</p>
          <slot />
        </div>
        <footer class="modal-foot">
          <button type="button" class="ghost-button" @click="cancel">{{ cancelLabel }}</button>
          <button type="button" :class="tone === 'danger' ? 'danger-button' : 'primary-button'" @click="confirm">{{ confirmLabel }}</button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  open: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "default";
}>(), {
  message: "",
  confirmLabel: "Confirm",
  cancelLabel: "Cancel",
  tone: "danger",
});

const emit = defineEmits<{ (e: "confirm"): void; (e: "cancel"): void }>();

const confirm = () => emit("confirm");
const cancel = () => emit("cancel");

const onKey = (e: KeyboardEvent) => {
  if (!props.open) return;
  if (e.key === "Escape") cancel();
  if (e.key === "Enter") confirm();
};
onMounted(() => window.addEventListener("keydown", onKey));
onBeforeUnmount(() => window.removeEventListener("keydown", onKey));
</script>

<style scoped>
.modal-backdrop { position: fixed; inset: 0; z-index: 1100; background: rgba(0,0,0,0.7); display: grid; place-items: center; padding: 16px; }
.modal { width: min(440px, 100%); background: var(--bg-panel-2, var(--bg-soft)); border: 1px solid var(--gilt); border-radius: 6px; box-shadow: 0 12px 40px rgba(0,0,0,0.6); display: grid; }
.modal-head { padding: 14px 18px 8px; border-bottom: 1px solid var(--line); }
.modal-head h2 { margin: 0; font-family: "IM Fell English", serif; font-weight: 400; font-size: 1.3rem; }
.modal-body { padding: 14px 18px; }
.msg { margin: 0; font-family: "EB Garamond", serif; color: var(--ink); }
.modal-foot { display: flex; justify-content: flex-end; gap: 8px; padding: 12px 18px; border-top: 1px solid var(--line); }
</style>
