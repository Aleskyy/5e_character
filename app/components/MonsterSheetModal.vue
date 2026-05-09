<template>
  <Teleport to="body">
    <div v-if="open" class="modal-backdrop" @click.self="$emit('close')">
      <div class="modal" role="dialog" aria-label="Monster sheet">
        <header class="modal-head">
          <div>
            <p class="eyebrow">Statblock</p>
            <h2>{{ monster.name }}</h2>
            <p class="muted small">{{ sizeLabel }} {{ typeLabel }} · CR {{ d.cr ?? "?" }} · {{ monster.source }}</p>
          </div>
          <button type="button" class="modal-close" @click="$emit('close')" aria-label="Close">×</button>
        </header>
        <div class="modal-body">
          <section class="block">
            <dl class="kv">
              <div><dt>AC</dt><dd>{{ d.ac ?? "—" }}</dd></div>
              <div><dt>HP</dt><dd>{{ d.hp?.average ?? "—" }}<small v-if="d.hp?.formula"> ({{ d.hp.formula }})</small></dd></div>
              <div><dt>Speed</dt><dd>{{ speedStr }}</dd></div>
              <div><dt>Passive Perc.</dt><dd>{{ d.passive ?? "—" }}</dd></div>
            </dl>
          </section>

          <section class="block">
            <p class="eyebrow">Abilities</p>
            <ul class="ab-row">
              <li v-for="ab in abilities" :key="ab"><span>{{ ab.toUpperCase() }}</span><strong>{{ d[ab] ?? "—" }}</strong><small>{{ mod(d[ab]) }}</small></li>
            </ul>
          </section>

          <section v-if="hasSaves" class="block">
            <p class="eyebrow">Saves</p>
            <p class="line">{{ savesStr }}</p>
          </section>

          <section v-if="hasSkills" class="block">
            <p class="eyebrow">Skills</p>
            <p class="line">{{ skillsStr }}</p>
          </section>

          <section v-if="d.senses?.length" class="block">
            <p class="eyebrow">Senses</p>
            <p class="line">{{ d.senses.join(", ") }}</p>
          </section>

          <section v-if="d.languages?.length" class="block">
            <p class="eyebrow">Languages</p>
            <p class="line">{{ d.languages.join(", ") }}</p>
          </section>

          <section v-if="d.immune?.length || d.resist?.length || d.vulnerable?.length || d.conditionImmune?.length" class="block">
            <p v-if="d.immune?.length" class="line"><strong>Damage Immunities:</strong> {{ joinDmg(d.immune) }}</p>
            <p v-if="d.resist?.length" class="line"><strong>Resistances:</strong> {{ joinDmg(d.resist) }}</p>
            <p v-if="d.vulnerable?.length" class="line"><strong>Vulnerabilities:</strong> {{ joinDmg(d.vulnerable) }}</p>
            <p v-if="d.conditionImmune?.length" class="line"><strong>Condition Immunities:</strong> {{ joinDmg(d.conditionImmune) }}</p>
          </section>

          <section v-for="grp in groups" :key="grp.title" class="block">
            <p class="eyebrow">{{ grp.title }}</p>
            <ul class="feat-list">
              <li v-for="(t, i) in grp.items" :key="i">
                <strong v-if="t.name">{{ t.name }}.</strong>
                <span>{{ entriesText(t.entries) }}</span>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { stripTags, type Entry } from "~/utils/entries";

type MonsterTrait = { name?: string; entries?: Entry[] };
type MonsterData = {
  size?: string[]; type?: string | { type?: string; tags?: string[] };
  ac?: number | unknown; hp?: { average?: number | null; formula?: string | null };
  speed?: Record<string, number | boolean>;
  str?: number; dex?: number; con?: number; int?: number; wis?: number; cha?: number;
  save?: Record<string, string>; skill?: Record<string, string>;
  senses?: string[]; passive?: number; languages?: string[]; cr?: string | number;
  immune?: unknown[]; resist?: unknown[]; vulnerable?: unknown[]; conditionImmune?: unknown[];
  trait?: MonsterTrait[]; action?: MonsterTrait[]; bonus?: MonsterTrait[]; reaction?: MonsterTrait[];
  legendary?: MonsterTrait[]; mythic?: MonsterTrait[]; legendaryHeader?: Entry[];
  lairActions?: MonsterTrait[]; regionalEffects?: MonsterTrait[];
  [k: string]: unknown;
};

const props = defineProps<{
  open: boolean;
  monster: { name: string; source: string; data: MonsterData };
}>();

defineEmits<{ (e: "close"): void }>();

const abilities = ["str", "dex", "con", "int", "wis", "cha"] as const;
const d = computed(() => props.monster.data);

const sizeLabel = computed(() => {
  const map: Record<string, string> = { T: "Tiny", S: "Small", M: "Medium", L: "Large", H: "Huge", G: "Gargantuan" };
  return (d.value.size ?? []).map((s) => map[s] ?? s).join("/");
});
const typeLabel = computed(() => {
  const t = d.value.type;
  if (!t) return "";
  if (typeof t === "string") return t;
  const tags = (t.tags ?? []).join(", ");
  return tags ? `${t.type} (${tags})` : t.type ?? "";
});

const mod = (n: number | undefined) => {
  if (typeof n !== "number") return "";
  const m = Math.floor((n - 10) / 2);
  return ` (${m >= 0 ? "+" : ""}${m})`;
};

const speedStr = computed(() => {
  const sp = d.value.speed ?? {};
  const parts: string[] = [];
  for (const [k, v] of Object.entries(sp)) {
    if (typeof v === "number") parts.push(`${k} ${v} ft.`);
  }
  return parts.join(", ") || "—";
});

const hasSaves = computed(() => Object.keys(d.value.save ?? {}).length > 0);
const savesStr = computed(() => Object.entries(d.value.save ?? {}).map(([k, v]) => `${k.toUpperCase()} ${v}`).join(", "));
const hasSkills = computed(() => Object.keys(d.value.skill ?? {}).length > 0);
const skillsStr = computed(() => Object.entries(d.value.skill ?? {}).map(([k, v]) => `${k} ${v}`).join(", "));

const joinDmg = (arr: unknown[]) =>
  arr.map((x) => typeof x === "string" ? x : (x as { [k: string]: unknown }).special ?? JSON.stringify(x)).join(", ");

const entriesText = (entries?: Entry[]): string => {
  if (!entries) return "";
  return entries.map((e) => {
    if (typeof e === "string") return stripTags(e);
    if (e.entries) return entriesText(e.entries);
    return "";
  }).join(" ");
};

const groups = computed(() => [
  { title: "Traits", items: d.value.trait ?? [] },
  { title: "Actions", items: d.value.action ?? [] },
  { title: "Bonus Actions", items: d.value.bonus ?? [] },
  { title: "Reactions", items: d.value.reaction ?? [] },
  { title: "Legendary Actions", items: d.value.legendary ?? [] },
  { title: "Mythic Actions", items: d.value.mythic ?? [] },
  { title: "Lair Actions", items: d.value.lairActions ?? [] },
  { title: "Regional Effects", items: d.value.regionalEffects ?? [] },
].filter((g) => g.items.length));
</script>

<style scoped>
.modal-backdrop { position: fixed; inset: 0; z-index: 1000; background: rgba(0,0,0,0.7); display: grid; place-items: center; padding: 16px; overflow-y: auto; }
@media (max-width: 520px) { .modal-backdrop { padding: 8px; } }
.modal { width: min(720px, 100%); max-height: 90dvh; overflow-y: auto; background: var(--bg-panel-2, var(--bg-soft)); border: 1px solid var(--gilt); border-radius: 6px; }
.modal-head { display: flex; justify-content: space-between; padding: 14px 18px; border-bottom: 1px solid var(--line); }
.modal-close { background: transparent; border: none; color: var(--ink-faint); font-size: 1.5rem; cursor: pointer; }
.small { font-size: 0.82rem; }
.modal-body { padding: 14px 18px; display: grid; gap: 14px; }
.kv { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 0; margin: 0; border: 1px solid var(--line); border-radius: 4px; overflow: hidden; }
.kv > div { padding: 6px 10px; border-right: 1px solid var(--line); border-bottom: 1px solid var(--line); background: var(--bg-soft); }
.kv dt { font-family: "IM Fell English SC", serif; font-size: 0.7rem; letter-spacing: 0.14em; color: var(--gilt); }
.kv dd { margin: 2px 0 0; font-family: "IM Fell English", serif; }
.ab-row { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; }
@media (min-width: 520px) { .ab-row { grid-template-columns: repeat(6, minmax(0, 1fr)); } }
.ab-row li { padding: 6px; border: 1px solid var(--line); border-radius: 4px; background: var(--bg-soft); display: grid; gap: 2px; text-align: center; }
.ab-row span { font-family: "IM Fell English SC", serif; font-size: 0.7rem; color: var(--gilt); }
.ab-row strong { font-family: "IM Fell English", serif; font-weight: 400; font-size: 1.1rem; }
.ab-row small { color: var(--ink-faint); font-size: 0.8rem; }
.line { margin: 0; font-family: "EB Garamond", serif; }
.feat-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; font-family: "EB Garamond", serif; }
.feat-list li { padding: 8px 10px; border: 1px solid var(--line); border-radius: 4px; background: var(--bg-soft); }
.feat-list strong { color: var(--gilt); margin-right: 4px; }
.eyebrow { margin: 0 0 6px; }
</style>
