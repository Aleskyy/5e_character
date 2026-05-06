<template>
  <main class="page">
    <nav class="crumbs">
      <NuxtLink to="/">Library</NuxtLink>
      <span class="sep">›</span>
      <span>Encounters</span>
    </nav>

    <header class="hero">
      <p class="eyebrow">Battlefield</p>
      <h1>Encounters</h1>
      <p class="lede">Build rosters of PCs, monsters, and named NPCs. Track initiative.</p>
    </header>

    <section class="panel">
      <div class="section-heading">
        <div><p class="eyebrow">Saved</p><h2>{{ encounters.length }} encounter{{ encounters.length === 1 ? '' : 's' }}</h2></div>
        <button type="button" class="primary-button" @click="createNew">+ New Encounter</button>
      </div>
      <ul v-if="encounters.length" class="enc-list">
        <li v-for="e in encounters" :key="e.id" class="enc-row">
          <NuxtLink :to="`/encounter/${e.id}`" class="enc-link">
            <strong>{{ e.name || "Untitled" }}</strong>
            <small>{{ e.entries.length }} combatant{{ e.entries.length === 1 ? '' : 's' }}</small>
          </NuxtLink>
          <button type="button" class="danger-button" @click="confirmDelete(e.id, e.name)">Delete</button>
        </li>
      </ul>
      <p v-else class="muted">No encounters yet. Create one above.</p>
    </section>
  </main>
</template>

<script setup lang="ts">
import type { Encounter } from "~/types/encounter";

const router = useRouter();
const { encounters, load, upsert, remove } = useEncounters();
onMounted(load);

const createNew = () => {
  const id = `enc:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 6)}`;
  const now = new Date().toISOString();
  const e: Encounter = { id, name: "New Encounter", entries: [], createdAt: now, updatedAt: now };
  upsert(e);
  router.push(`/encounter/${id}`);
};

const { confirm: askConfirm } = useConfirm();
const confirmDelete = async (id: string, name: string) => {
  if (await askConfirm({ title: `Delete encounter "${name}"?`, message: "This cannot be undone.", confirmLabel: "Delete" })) remove(id);
};
</script>

<style scoped>
.enc-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
.enc-row { display: flex; align-items: center; gap: 12px; padding: 10px 14px; border: 1px solid var(--line); border-radius: 4px; background: var(--bg-soft); }
.enc-link { flex: 1; display: grid; gap: 2px; text-decoration: none; color: inherit; }
.enc-link strong { font-family: "IM Fell English", serif; font-weight: 400; font-size: 1.1rem; }
.enc-link small { color: var(--ink-faint); font-style: italic; }
</style>
