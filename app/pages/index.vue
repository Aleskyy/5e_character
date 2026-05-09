<template>
  <main class="page">
    <header class="hero">
      <p class="eyebrow">Offline 5e Character Builder</p>
      <h1>Character Forge</h1>
      <p class="lede">Local library of characters, encounters, and homebrew.</p>
    </header>

    <section class="panel">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Local library</p>
          <h2>{{ characters.length }} character{{ characters.length === 1 ? "" : "s" }}</h2>
        </div>
        <div class="library-actions">
          <NuxtLink to="/character/new" class="primary-button button-link">+ New Character</NuxtLink>
          <button type="button" class="ghost-button" @click="shareOpen = true">Import</button>
          <button type="button" class="ghost-button" @click="massOpen = true">Mass Import / Export</button>
        </div>
      </div>

      <div v-if="characters.length" class="character-list">
        <NuxtLink
          v-for="character in sortedCharacters"
          :key="character.id"
          :to="`/character/${character.id}`"
          class="character-row"
        >
          <span class="char-thumb" :class="{ empty: !character.imageUrl }">
            <img v-if="character.imageUrl" :src="character.imageUrl" alt="" />
          </span>
          <span class="char-name">{{ character.name || "Unnamed" }}</span>
          <span class="char-meta">
            <small>Lvl {{ character.level }}</small>
            <small>{{ classNameFor(character) || "—" }}</small>
            <small>{{ raceNameFor(character) || "—" }}</small>
          </span>
        </NuxtLink>
      </div>
      <p v-else class="muted">No saved characters yet. <NuxtLink to="/character/new">Create one →</NuxtLink></p>
    </section>

    <section v-if="recent.length" class="panel">
      <div class="section-heading">
        <div><p class="eyebrow">Recent</p><h2>Latest activity</h2></div>
      </div>
      <ul class="recent-list">
        <li v-for="r in recent" :key="r.key">
          <NuxtLink :to="r.href" class="recent-row">
            <span class="kind-tag">{{ r.kindLabel }}</span>
            <span class="recent-name">‎ ‎ ‎ ‎ {{ r.name }}</span>
            <small class="recent-when">{{ formatWhen(r.at) }}</small>
          </NuxtLink>
        </li>
      </ul>
    </section>

    <ShareCharacterModal
      :open="shareOpen"
      :character="null"
      @close="shareOpen = false"
      @import="onShareImport"
    />
    <MassIOModal :open="massOpen" @close="massOpen = false" />
  </main>
</template>

<script setup lang="ts">
import type { CharacterDraft } from "~/types/character";
import type { ClassData, RaceData, RulesEntity } from "~/types/rules";

const router = useRouter();
const { characters, load, save } = useCharacters();
const { encounters, customMonsters, load: loadEnc } = useEncounters();
const { entries: homebrewEntries, load: loadHb } = useHomebrew();
const { items: customItems, load: loadItems } = useItemLibrary();

const { data: classes } = useFetch<RulesEntity<ClassData>[]>("/data/classes.json", { default: () => [], server: false });
const { data: races } = useFetch<RulesEntity<RaceData>[]>("/data/races.json", { default: () => [], server: false });

onMounted(() => { load(); loadEnc(); loadHb(); loadItems(); });

const cloneDraft = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

const shareOpen = ref(false);
const massOpen = ref(false);
const onShareImport = (incoming: CharacterDraft) => {
  const { id: _drop, ...rest } = incoming as CharacterDraft & { id?: string };
  const saved = save(cloneDraft(rest as CharacterDraft));
  shareOpen.value = false;
  router.push(`/character/${saved.id}`);
};

const sortedCharacters = computed(() =>
  [...characters.value].sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "")),
);

const classNameFor = (c: CharacterDraft) => classes.value.find((x) => x.id === c.classId)?.name ?? "";
const raceNameFor = (c: CharacterDraft) => races.value.find((x) => x.id === c.raceId)?.name ?? "";

type RecentItem = { key: string; name: string; href: string; kindLabel: string; at: string };

const recent = computed<RecentItem[]>(() => {
  const items: RecentItem[] = [];
  for (const c of characters.value) {
    items.push({ key: `c-${c.id}`, name: c.name || "Unnamed", href: `/character/${c.id}`, kindLabel: "Character", at: c.updatedAt ?? c.createdAt ?? "" });
  }
  for (const e of encounters.value) {
    items.push({ key: `e-${e.id}`, name: e.name || "Encounter", href: `/encounter/${e.id}`, kindLabel: "Encounter", at: e.updatedAt ?? e.createdAt ?? "" });
  }
  for (const m of customMonsters.value) {
    items.push({ key: `m-${m.id}`, name: m.name, href: "/homebrew", kindLabel: "Monster", at: m.createdAt ?? "" });
  }
  for (const it of customItems.value) {
    items.push({ key: `i-${it.id}`, name: it.name, href: "/homebrew", kindLabel: "Item", at: it.createdAt ?? "" });
  }
  for (const h of homebrewEntries.value) {
    items.push({ key: `h-${h.id}`, name: h.name, href: "/homebrew", kindLabel: hbLabel(h.kind), at: h.createdAt ?? "" });
  }
  return items.filter((x) => x.at).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8);
});

const hbLabel = (k: string) => k.charAt(0).toUpperCase() + k.slice(1);

const formatWhen = (iso: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
};
</script>

<style scoped>
.library-actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.button-link { display: inline-flex; align-items: center; min-height: 36px; padding: 0 14px; font-family: "IM Fell English SC", serif; font-size: 0.82rem; letter-spacing: 0.1em; text-transform: uppercase; color: #1a0e0a; }

.character-list { display: grid; gap: 8px; }
.character-row {
  display: flex; align-items: center; gap: 14px;
  padding: 10px 14px; border: 1px solid var(--line); border-radius: 4px;
  background: var(--bg-soft); color: var(--ink); text-decoration: none;
  transition: border-color 160ms ease, background 160ms ease;
}
.character-row:hover { border-color: var(--gilt); background: var(--bg-panel-2); color: var(--ink); }
.char-thumb {
  flex: 0 0 auto;
  width: 48px; height: 48px;
  border: 1px solid var(--line);
  border-radius: 4px;
  background: var(--bg);
  overflow: hidden;
  display: grid; place-items: center;
}
.char-thumb img { width: 100%; height: 100%; object-fit: cover; }
.char-thumb.empty::before { content: "✦"; color: var(--ink-faint); font-family: "IM Fell English", serif; font-size: 1.2rem; }
.char-name { font-family: "IM Fell English", serif; font-size: 1.15rem; flex: 1 1 auto; min-width: 0; overflow-wrap: anywhere; }
.char-meta { display: flex; gap: 14px; color: var(--ink-faint); font-style: italic; flex-wrap: wrap; justify-content: flex-end; }

.recent-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
.recent-row {
  display: grid; grid-template-columns: 84px 1fr auto; gap: 10px; align-items: center;
  padding: 8px 12px; border: 1px solid var(--line); border-radius: 4px;
  background: var(--bg-soft); color: var(--ink); text-decoration: none;
  transition: border-color 160ms ease, background 160ms ease;
}
.recent-row:hover { border-color: var(--gilt-soft); background: var(--bg-panel-2); color: var(--ink); }
.kind-tag { font-family: "IM Fell English SC", serif; font-size: 0.7rem; letter-spacing: 0.14em; color: var(--gilt); text-transform: uppercase; }
.recent-name { font-family: "EB Garamond", serif; font-size: 1rem; }
.recent-when { color: var(--ink-faint); font-style: italic; font-size: 0.82rem; }
</style>
