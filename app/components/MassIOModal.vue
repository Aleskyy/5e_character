<template>
  <Teleport to="body">
    <div v-if="open" class="modal-backdrop" @click.self="$emit('close')">
      <div class="modal" role="dialog" aria-label="Mass import / export">
        <header class="modal-head">
          <div>
            <p class="eyebrow">Bulk</p>
            <h2>Mass Import / Export</h2>
          </div>
          <button type="button" class="modal-close" @click="$emit('close')" aria-label="Close">×</button>
        </header>

        <div class="modal-body">
          <section class="block">
            <p class="eyebrow">Import (JSON files)</p>
            <p class="muted small">Drop or pick multiple .json files. Each is auto-detected as character / encounter / monster / item / homebrew (spell, race, subrace, class).</p>
            <input type="file" accept="application/json,.json" multiple @change="onFiles" />
          </section>

          <section class="block">
            <p class="eyebrow">Or paste (single JSON, share code, or array)</p>
            <textarea v-model="pasteInput" class="code-area" rows="4" placeholder="5EC1:... · {...} · [{...}, {...}]"></textarea>
            <div class="row">
              <button type="button" class="primary-button" :disabled="!pasteInput.trim() || busy" @click="processPaste">{{ busy ? "Working…" : "Import paste" }}</button>
            </div>
          </section>

          <section v-if="report.length" class="block">
            <p class="eyebrow">Result</p>
            <ul class="report">
              <li v-for="(r, i) in report" :key="i" :class="{ ok: r.ok, fail: !r.ok }">
                <strong>{{ r.source }}</strong> — <span>{{ r.message }}</span>
              </li>
            </ul>
          </section>

          <section class="block">
            <p class="eyebrow">Export Bundle</p>
            <p class="muted small">Download a single JSON containing every selected category.</p>
            <div class="check-row">
              <label class="check"><input type="checkbox" v-model="bundle.characters" /> Characters</label>
              <label class="check"><input type="checkbox" v-model="bundle.encounters" /> Encounters</label>
              <label class="check"><input type="checkbox" v-model="bundle.customMonsters" /> Custom Monsters</label>
              <label class="check"><input type="checkbox" v-model="bundle.customItems" /> Custom Items</label>
              <label class="check"><input type="checkbox" v-model="bundle.homebrew" /> Homebrew</label>
            </div>
            <div class="row">
              <button type="button" class="ghost-button" @click="downloadBundle">Download bundle</button>
            </div>
          </section>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { detectKind, KIND_LABEL, type ImportKind } from "~/utils/import-detect";
import { decodeShare } from "~/utils/share-code";
import type { CharacterDraft } from "~/types/character";
import type { Encounter, CustomMonster } from "~/types/encounter";
import type { CustomItem } from "~/types/items";
import type { HomebrewEntry } from "~/types/homebrew";

defineProps<{ open: boolean }>();
defineEmits<{ (e: "close"): void }>();

const { save: saveCharacter, characters } = useCharacters();
const { upsert: upsertEncounter, upsertMonster, encounters, customMonsters } = useEncounters();
const { items: customItems, upsert: upsertItem } = useItemLibrary();
const { entries: homebrewEntries, upsert: upsertHomebrew } = useHomebrew();

const pasteInput = ref("");
const busy = ref(false);
const report = ref<{ source: string; ok: boolean; message: string }[]>([]);

const bundle = reactive({
  characters: true, encounters: true, customMonsters: true, customItems: true, homebrew: true,
});

const newId = (prefix: string) => `${prefix}:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 6)}`;

const routeOne = (obj: unknown, source: string) => {
  const kind = detectKind(obj);
  if (!kind) {
    report.value.push({ source, ok: false, message: "Unknown shape — skipped" });
    return;
  }
  try {
    switch (kind) {
      case "character": {
        const { id: _drop, ...rest } = obj as CharacterDraft & { id?: string };
        saveCharacter(rest as CharacterDraft);
        break;
      }
      case "encounter": {
        const enc = obj as Encounter;
        upsertEncounter({ ...enc, id: enc.id || newId("enc"), createdAt: enc.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() });
        break;
      }
      case "customMonster": {
        const m = obj as CustomMonster;
        upsertMonster({ ...m, id: m.id || newId("cmon") });
        break;
      }
      case "customItem": {
        const it = obj as CustomItem;
        upsertItem({ ...it, id: it.id || newId("item"), createdAt: it.createdAt || new Date().toISOString() });
        break;
      }
      case "hbSpell":
      case "hbRace":
      case "hbSubrace":
      case "hbClass":
      case "hbNpc": {
        const hb = obj as HomebrewEntry;
        upsertHomebrew({ ...hb, id: hb.id || newId(`hb-${hb.kind}`), createdAt: hb.createdAt || new Date().toISOString() });
        break;
      }
    }
    report.value.push({ source, ok: true, message: `Imported as ${KIND_LABEL[kind]}` });
  } catch (err) {
    report.value.push({ source, ok: false, message: `Failed: ${(err as Error).message}` });
  }
};

const processInput = async (raw: string, source: string) => {
  let parsed: unknown;
  try { parsed = await decodeShare(raw); }
  catch (err) {
    report.value.push({ source, ok: false, message: `Parse failed: ${(err as Error).message}` });
    return;
  }
  if (Array.isArray(parsed)) {
    parsed.forEach((item, i) => routeOne(item, `${source}[${i}]`));
    return;
  }
  if (parsed && typeof parsed === "object") {
    if (detectKind(parsed)) {
      routeOne(parsed, source);
      return;
    }
    const bundleKeys = ["characters", "encounters", "customMonsters", "customItems", "homebrew", "items", "spells", "races", "subraces", "classes"];
    const obj = parsed as Record<string, unknown>;
    const hasBundleArrays = bundleKeys.some((k) => Array.isArray(obj[k]));
    if (hasBundleArrays) {
      for (const k of bundleKeys) {
        const v = obj[k];
        if (Array.isArray(v)) v.forEach((item, i) => routeOne(item, `${source}.${k}[${i}]`));
      }
      return;
    }
    routeOne(parsed, source);
    return;
  }
  report.value.push({ source, ok: false, message: "Empty / non-object payload" });
};

const onFiles = async (e: Event) => {
  const files = Array.from((e.target as HTMLInputElement).files ?? []);
  if (!files.length) return;
  busy.value = true;
  report.value = [];
  for (const f of files) {
    const txt = await f.text();
    await processInput(txt, f.name);
  }
  busy.value = false;
  (e.target as HTMLInputElement).value = "";
};

const processPaste = async () => {
  busy.value = true;
  report.value = [];
  await processInput(pasteInput.value, "paste");
  busy.value = false;
  pasteInput.value = "";
};

const downloadBundle = () => {
  const out: Record<string, unknown> = {};
  if (bundle.characters) out.characters = characters.value;
  if (bundle.encounters) out.encounters = encounters.value;
  if (bundle.customMonsters) out.customMonsters = customMonsters.value;
  if (bundle.customItems) out.customItems = customItems.value;
  if (bundle.homebrew) out.homebrew = homebrewEntries.value;
  const json = JSON.stringify(out, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `forge-bundle-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
};
</script>

<style scoped>
.modal-backdrop { position: fixed; inset: 0; z-index: 1000; background: rgba(0,0,0,0.7); display: grid; place-items: center; padding: 16px; overflow-y: auto; }
.modal { width: min(680px, 100%); max-height: 92vh; overflow-y: auto; background: var(--bg-panel-2, var(--bg-soft)); border: 1px solid var(--gilt); border-radius: 6px; }
.modal-head { display: flex; justify-content: space-between; padding: 14px 18px; border-bottom: 1px solid var(--line); }
.modal-close { background: transparent; border: none; color: var(--ink-faint); font-size: 1.5rem; cursor: pointer; }
.modal-body { padding: 14px 18px; display: grid; gap: 16px; }
.block { display: grid; gap: 8px; }
.code-area { width: 100%; font-family: monospace; font-size: 0.78rem; resize: vertical; }
.row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.muted.small { font-size: 0.78rem; margin: 0; }
.report { list-style: none; margin: 0; padding: 0; display: grid; gap: 4px; max-height: 220px; overflow-y: auto; }
.report li { padding: 6px 10px; border: 1px solid var(--line); border-radius: 4px; background: var(--bg-soft); font-size: 0.85rem; }
.report li.ok { border-left: 3px solid var(--gilt); }
.report li.fail { border-left: 3px solid var(--rubric); }
.check-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 4px; }
.check { display: grid; grid-template-columns: 16px 1fr; gap: 8px; align-items: center; padding: 5px 10px; border: 1px solid var(--line); border-radius: 4px; background: var(--bg-soft); cursor: pointer; font-size: 0.85rem; }
.check input[type="checkbox"] { width: 14px; height: 14px; margin: 0; justify-self: center; }
</style>
