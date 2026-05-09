<template>
  <main class="page" v-if="character">
    <nav class="crumbs">
      <NuxtLink to="/">Library</NuxtLink>
      <span class="sep">›</span>
      <span>{{ character.name || "Unnamed" }}</span>
    </nav>

    <header class="sheet-header">
      <div>
        <p class="eyebrow">
          {{ classLabel || "No class" }} · Level
          <input
            v-model.number="character.level"
            type="number"
            min="1"
            max="20"
            class="level-input"
            aria-label="Character level"
          />
        </p>
        <h1>{{ character.name || "Unnamed" }}</h1>
        <p class="lede" v-if="raceLabel">{{ raceLabel }}<span v-if="subclassLabel"> · {{ subclassLabel }}</span></p>
      </div>
      <div class="header-actions">
        <button type="button" class="ghost-button" @click="shareOpen = true">Share / Import</button>
        <button type="button" class="ghost-button" @click="exportCharacter">Export</button>
        <button type="button" class="danger-button" @click="deleteCharacter">Delete</button>
      </div>
    </header>

    <ShareCharacterModal
      :open="shareOpen"
      :character="character"
      @close="shareOpen = false"
      @import="onShareImport"
    />



    <TopStats :character="character" :prof-bonus="profBonus" :equipped-ac-bonus="equippedAcBonus" />
<div class="recap-buttons">
        <button type="button" class="primary-button" @click="combatModalOpen = true">⚔ Combat Recap</button>
        <button type="button" class="ghost-button" @click="rpModalOpen = true">✦ RP Recap</button>
      </div>
    <CombatModal
      :open="combatModalOpen"
      :character="character"
      :prof-bonus="profBonus"
      :selected-class="selectedClass"
      :selected-subclass="selectedSubclass"
      :spells="spells"
      @close="combatModalOpen = false"
    />
    <RolePlayModal
      :open="rpModalOpen"
      :character="character"
      :race-label="raceLabel"
      :prof-bonus="profBonus"
      @close="rpModalOpen = false"
    />

        <div id="vitals" class="grid">
      <section class="panel">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Vitality</p>
            <h2>Hit Points</h2>
          </div>
        </div>

        <div class="hp-display">
          <div class="hp-current">
            <span class="hp-num">{{ character.currentHp }}</span>
            <span class="hp-sep">/</span>
            <span class="hp-max">{{ character.maxHp }}</span>
          </div>
          <div class="hp-bar"><span :style="{ width: hpPct + '%' }"></span></div>
        </div>

        <div class="hp-controls">
          <button type="button" class="hp-dmg" @click="adjustHp(-hpDelta)" :disabled="!hpDelta">− Damage</button>
          <input
            v-model.number="hpDelta"
            type="number"
            min="0"
            class="hp-delta"
            aria-label="HP change amount"
            placeholder="0"
          />
          <button type="button" class="hp-heal" @click="adjustHp(hpDelta)" :disabled="!hpDelta">+ Heal</button>
          <button type="button" class="ghost-button full-rest" @click="fullRest">Long rest</button>
        </div>

        <div class="form-grid hp-grid">
          <label>Current <input v-model.number="character.currentHp" type="number" min="0" /></label>
          <label>Max <input v-model.number="character.maxHp" type="number" min="1" /></label>
          <label>Temporary <input v-model.number="character.temporaryHp" type="number" min="0" /></label>
        </div>
      </section>

      <section class="panel">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Coffre</p>
            <h2>Currency</h2>
          </div>
        </div>

        <div class="coin-grid">
          <label class="coin coin-cp"><span>CP</span><input v-model.number="character.currency.cp" type="number" min="0" /></label>
          <label class="coin coin-sp"><span>SP</span><input v-model.number="character.currency.sp" type="number" min="0" /></label>
          <label class="coin coin-gp"><span>GP</span><input v-model.number="character.currency.gp" type="number" min="0" /></label>
          <label class="coin coin-pp"><span>PP</span><input v-model.number="character.currency.pp" type="number" min="0" /></label>
        </div>
      </section>
    </div>
    <FeaturesSummary
      :race-features="raceFeatureNames"
      :class-features-by-level="classFeaturesByLevel as any"
      :subclass-features-by-level="subclassFeaturesByLevel as any"
    />

    <InventoryPanel :character="character" />


        <section id="abilities" class="panel">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Aptitudes</p>
          <h2>Ability Scores</h2>
        </div>
      </div>
      <div class="ability-grid">
        <label v-for="ability in abilities" :key="ability" class="ability-card">
          <span>{{ ability.toUpperCase() }}</span>
          <input v-model.number="character.abilityScores[ability]" type="number" min="1" max="30" />
          <strong>{{ signed(abilityModifier(character.abilityScores[ability])) }}</strong>
          <em :class="{ proficient: isSaveProficient(ability) }" @click="toggleSaveProficiency(ability)">
            Save {{ signed(saveBonus(ability)) }}
          </em>
        </label>
      </div>
    </section>
    <div id="combat">
      <CombatPanel :character="character" :hit-die-faces="hitDieFaces" :prof-bonus="profBonus" />
    </div>


    <div id="attacks"><AttacksPanel :character="character" :prof-bonus="profBonus" /></div>

    <section id="casting" class="panel" v-if="spellSaveDc !== null">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Casting</p>
          <h2>Spellcasting</h2>
        </div>
      </div>
      <dl class="cast-grid">
        <div><dt>Ability</dt><dd>{{ spellcastingAbility?.toUpperCase() }}</dd></div>
        <div><dt>Save DC</dt><dd>{{ spellSaveDc }}</dd></div>
        <div><dt>Attack</dt><dd>{{ signed(spellAttackBonus ?? 0) }}</dd></div>
        <div><dt>Prof.</dt><dd>{{ signed(profBonus) }}</dd></div>
      </dl>
    </section>

        <div id="spells">
      <SpellPreparationPanel
        v-if="spellSaveDc !== null"
        :character="character"
        :spells="spells"
        :selected-class="selectedClass"
        :selected-subclass="selectedSubclass"
        :spellcasting-mod="spellcastingMod"
        :prof-bonus="profBonus"
      />
    </div>
    <div id="resources"><ClassResourcesPanel
      v-if="classLabel"
      :character="character"
      :class-name="classLabel"
      :level="character.level"
    /></div>

    <section id="slots" class="panel" v-if="spellSlots.length">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Magicks</p>
          <h2>Spell Slots</h2>
        </div>
        <button type="button" class="ghost-button" @click="restoreAllSlots">Restore all</button>
      </div>

      <div class="slot-rows">
        <div v-for="(total, idx) in spellSlots" :key="idx" class="slot-row" v-show="total > 0">
          <span class="slot-label">L{{ idx + 1 }}</span>
          <div class="pips">
            <button
              v-for="n in total"
              :key="n"
              type="button"
              class="pip"
              :class="{ spent: n <= usedSlots(idx) }"
              :aria-label="`Slot ${n} of level ${idx + 1}`"
              @click="toggleSlot(idx, n)"
            ></button>
          </div>
          <span class="slot-count">{{ total - usedSlots(idx) }} / {{ total }}</span>
        </div>
      </div>
    </section>





    <section id="skills" class="panel">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Talents</p>
          <h2>Skills</h2>
        </div>
        <span class="muted prof-hint">Click ◇ for proficiency, ✦ for expertise</span>
      </div>
      <ul class="skill-list">
        <li v-for="skill in SKILLS" :key="skill.key" class="skill-row">
          <button
            type="button"
            class="prof-toggle"
            :class="{ proficient: isSkillProficient(skill.key), expert: isSkillExpert(skill.key) }"
            :aria-label="`Toggle ${skill.name} proficiency`"
            @click="cycleSkill(skill.key)"
          >
            <span v-if="isSkillExpert(skill.key)">✦</span>
            <span v-else-if="isSkillProficient(skill.key)">◆</span>
            <span v-else>◇</span>
          </button>
          <span class="skill-name">{{ skill.name }}</span>
          <span class="skill-ability">{{ skill.ability.toUpperCase() }}</span>
          <span class="skill-bonus">{{ signed(skillBonus(skill)) }}</span>
        </li>
      </ul>
    </section>

    <div id="profs"><ProficienciesPanel :character="character" /></div>

    <div id="background"><BackgroundPanel :character="character" /></div>


    <div id="relations"><RelationsPanel :character="character" /></div>

    <section id="heritage" class="panel" v-if="raceEntries.length">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Heritage</p>
          <h2>{{ raceLabel }} Traits</h2>
        </div>
      </div>
      <RuleEntries :entries="raceEntries" />
    </section>

    <section id="class-features" class="panel" v-if="classFeaturesByLevel.length">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Discipline</p>
          <h2>{{ classLabel }} Features</h2>
        </div>
      </div>
      <details
        v-for="group in classFeaturesByLevel"
        :key="`cl-${group.level}`"
        class="feature-group"
        open
      >
        <summary>
          <span class="lvl">Lv {{ group.level }}</span>
          <span class="names">{{ group.features.map((f: any) => f.name).join(" · ") }}</span>
        </summary>
        <article v-for="feature in group.features" :key="feature.id" :id="`cl-${feature.id}`" class="feature">
          <h3>{{ feature.name }}</h3>
          <RuleEntries :entries="(feature.data.entries ?? []) as any" />
        </article>
      </details>
    </section>

    <section id="subclass-features" class="panel" v-if="subclassFeaturesByLevel.length">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Path</p>
          <h2>{{ subclassLabel }} Features</h2>
        </div>
      </div>
      <details
        v-for="group in subclassFeaturesByLevel"
        :key="`sc-${group.level}`"
        class="feature-group"
        open
      >
        <summary>
          <span class="lvl">Lv {{ group.level }}</span>
          <span class="names">{{ group.features.map((f: any) => f.name).join(" · ") }}</span>
        </summary>
        <article v-for="feature in group.features" :key="feature.id" :id="`sc-${feature.id}`" class="feature">
          <h3>{{ feature.name }}</h3>
          <RuleEntries :entries="(feature.data.entries ?? []) as any" />
        </article>
      </details>
    </section>

    <section id="notes" class="panel">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Scratchpad</p>
          <h2>Notes</h2>
        </div>
      </div>
      <textarea v-model="character.notes" rows="6" placeholder="Session notes, plot threads, reminders…"></textarea>
    </section>

    <p class="muted save-status">{{ saveStatus }}</p>

    <SectionNav :links="navLinks" />
  </main>

  <main class="page" v-else>
    <nav class="crumbs">
      <NuxtLink to="/">Library</NuxtLink>
      <span class="sep">›</span>
      <span>Not found</span>
    </nav>
    <p class="muted">No character with that id. <NuxtLink to="/">Return to library.</NuxtLink></p>
  </main>
</template>

<script setup lang="ts">
import type { CharacterDraft } from "~/types/character";
import type { Ability, ClassData, RaceData, RulesEntity, SpellData, SubclassData } from "~/types/rules";
import {
  abilities,
  abilityModifier,
  proficiencyBonus,
  signed,
  spellSlotsForLevel,
} from "~/utils/character";
import { SKILLS, type Skill } from "~/utils/skills";

type ClassFeature = RulesEntity<{ className: string; classSource: string; level: number | null; entries: unknown[] }>;
type SubclassFeature = RulesEntity<{ className: string; classSource: string; subclassShortName: string; subclassSource: string; level: number | null; entries: unknown[] }>;

const route = useRoute();
const router = useRouter();
const id = computed(() => String(route.params.id));

const { characters, load, save, remove } = useCharacters();

const { data: classes } = useFetch<RulesEntity<ClassData>[]>("/data/classes.json", { default: () => [], server: false });
const { data: races } = useFetch<RulesEntity<RaceData>[]>("/data/races.json", { default: () => [], server: false });
const { data: subclasses } = useFetch<RulesEntity<SubclassData>[]>("/data/subclasses.json", { default: () => [], server: false });
const { data: spells } = useFetch<RulesEntity<SpellData>[]>("/data/spells.json", { default: () => [], server: false });
const { data: classFeatures } = useFetch<ClassFeature[]>("/data/classFeatures.json", { default: () => [], server: false });
const { data: subclassFeatures } = useFetch<SubclassFeature[]>("/data/subclassFeatures.json", { default: () => [], server: false });

const combatModalOpen = ref(false);
const rpModalOpen = ref(false);
const character = ref<CharacterDraft | null>(null);
const saveStatus = ref("");
let saveTimer: ReturnType<typeof setTimeout> | null = null;

const hydrate = () => {
  const found = characters.value.find((c) => c.id === id.value);
  if (!found) { character.value = null; return; }
  character.value = {
    ...JSON.parse(JSON.stringify(found)),
    usedSpellSlots: found.usedSpellSlots ?? [],
    notes: found.notes ?? "",
    temporaryHp: found.temporaryHp ?? 0,
  };
};

onMounted(() => {
  load();
  hydrate();
});

watch(() => id.value, hydrate);
watch(characters, () => { if (!character.value) hydrate(); });

watch(character, (next) => {
  if (!next) return;
  if (saveTimer) clearTimeout(saveTimer);
  saveStatus.value = "Saving…";
  saveTimer = setTimeout(() => {
    save(JSON.parse(JSON.stringify(next)));
    saveStatus.value = `Saved ${new Date().toLocaleTimeString()}`;
  }, 350);
}, { deep: true });

const selectedClass = computed(() => character.value ? classes.value.find((c) => c.id === character.value!.classId) : undefined);
const selectedSubclass = computed(() => character.value ? subclasses.value.find((s) => s.id === character.value!.subclassId) : undefined);
const selectedRace = computed(() => character.value ? races.value.find((r) => r.id === character.value!.raceId) : undefined);

const classLabel = computed(() => selectedClass.value?.name ?? "");
const subclassLabel = computed(() => selectedSubclass.value?.name ?? "");
const raceLabel = computed(() => selectedRace.value?.name ?? "");

const profBonus = computed(() => proficiencyBonus(character.value?.level ?? 1));

const hitDieFaces = computed(() => selectedClass.value?.data.hitDie?.faces ?? 8);

const { items: itemLib, load: loadItemLib } = useItemLibrary();
onMounted(() => loadItemLib());

const equippedAcBonus = computed(() => {
  const inv = character.value?.inventory ?? [];
  return inv
    .filter((e) => e.equipped)
    .map((e) => itemLib.value.find((i) => i.id === e.itemId))
    .reduce((sum, item) => sum + (item?.acBonus ?? 0), 0);
});

const spellSlots = computed(() => spellSlotsForLevel(selectedClass.value, character.value?.level ?? 1));

const spellcastingAbility = computed(() => selectedClass.value?.data.spellcastingAbility ?? null);

const spellcastingMod = computed(() => {
  if (!spellcastingAbility.value || !character.value) return 0;
  return abilityModifier(character.value.abilityScores[spellcastingAbility.value]);
});

const spellAttackBonus = computed(() => {
  if (!spellcastingAbility.value || !character.value) return null;
  return spellcastingMod.value + profBonus.value;
});

const spellSaveDc = computed(() => spellAttackBonus.value === null ? null : spellAttackBonus.value + 8);

const knownSpells = computed(() => {
  if (!character.value) return [];
  const ids = new Set(character.value.selectedSpellIds);
  return spells.value
    .filter((s) => ids.has(s.id))
    .sort((a, b) => a.data.level - b.data.level || a.name.localeCompare(b.name));
});

const classFeaturesByLevel = computed(() => {
  if (!character.value || !selectedClass.value) return [];
  const lvl = character.value.level;
  const matches = classFeatures.value.filter(
    (f) =>
      f.data.className === selectedClass.value!.name
      && f.data.classSource === selectedClass.value!.source
      && (f.data.level ?? 0) <= lvl,
  );
  const groups = new Map<number, ClassFeature[]>();
  for (const f of matches) {
    const lv = f.data.level ?? 0;
    if (!groups.has(lv)) groups.set(lv, []);
    groups.get(lv)!.push(f);
  }
  return [...groups.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([level, features]) => ({ level, features }));
});

const subclassFeaturesByLevel = computed(() => {
  if (!character.value || !selectedSubclass.value || !selectedClass.value) return [];
  const lvl = character.value.level;
  const matches = subclassFeatures.value.filter(
    (f) =>
      f.data.className === selectedClass.value!.name
      && f.data.classSource === selectedClass.value!.source
      && f.data.subclassShortName === selectedSubclass.value!.data.shortName
      && f.data.subclassSource === selectedSubclass.value!.source
      && (f.data.level ?? 0) <= lvl,
  );
  const groups = new Map<number, SubclassFeature[]>();
  for (const f of matches) {
    const lv = f.data.level ?? 0;
    if (!groups.has(lv)) groups.set(lv, []);
    groups.get(lv)!.push(f);
  }
  return [...groups.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([level, features]) => ({ level, features }));
});

const raceEntries = computed(() => (selectedRace.value?.data.entries ?? []) as any[]);

const raceFeatureNames = computed(() =>
  raceEntries.value
    .filter((e: any) => e && typeof e === "object" && e.name)
    .map((e: any) => ({ name: String(e.name) })),
);

const navLinks = computed(() => {
  const links = [
    { id: "vitals", label: "Vitals & Pack" },
    { id: "combat", label: "Combat" },
  ];
  if (resourcesAvailable.value) links.push({ id: "resources", label: "Resources" });
  if (spellSlotsAvailable.value) links.push({ id: "slots", label: "Spell Slots" });
  links.push({ id: "abilities", label: "Abilities" });
  if (spellSaveDc.value !== null) links.push({ id: "casting", label: "Spellcasting" });
  links.push({ id: "skills", label: "Skills" });
  if (anyEquippedWeapon.value) links.push({ id: "attacks", label: "Attacks" });
  links.push({ id: "relations", label: "Relations" });
  links.push({ id: "profs", label: "Proficiencies" });
  links.push({ id: "background", label: "Background" });
  if (spellSaveDc.value !== null) links.push({ id: "spells", label: "Spells" });
  if (raceEntries.value.length) links.push({ id: "heritage", label: "Heritage" });
  if (classFeaturesByLevel.value.length) links.push({ id: "class-features", label: "Class Features" });
  if (subclassFeaturesByLevel.value.length) links.push({ id: "subclass-features", label: "Subclass Features" });
  links.push({ id: "notes", label: "Notes" });
  return links;
});

const resourcesAvailable = computed(() => {
  if (!classLabel.value) return false;
  return true;
});

const spellSlotsAvailable = computed(() => spellSlots.value.length > 0);

const anyEquippedWeapon = computed(() => (character.value?.inventory ?? []).some((e) => e.equipped));

const isSaveProficient = (ability: Ability) => {
  const explicit = character.value?.savingThrowProficiencies;
  if (explicit && explicit.length) return explicit.includes(ability);
  return selectedClass.value?.data.savingThrowProficiencies?.includes(ability) ?? false;
};

const saveBonus = (ability: Ability) => {
  if (!character.value) return 0;
  const mod = abilityModifier(character.value.abilityScores[ability]);
  return mod + (isSaveProficient(ability) ? profBonus.value : 0);
};

const toggleSaveProficiency = (ability: Ability) => {
  if (!character.value) return;
  const current = character.value.savingThrowProficiencies?.length
    ? [...character.value.savingThrowProficiencies]
    : [...(selectedClass.value?.data.savingThrowProficiencies ?? [])];
  const idx = current.indexOf(ability);
  if (idx >= 0) current.splice(idx, 1); else current.push(ability);
  character.value.savingThrowProficiencies = current;
};

const isSkillProficient = (key: string) =>
  character.value?.skillProficiencies?.includes(key) ?? false;

const isSkillExpert = (key: string) =>
  character.value?.skillExpertise?.includes(key) ?? false;

const cycleSkill = (key: string) => {
  if (!character.value) return;
  const prof = new Set(character.value.skillProficiencies ?? []);
  const exp = new Set(character.value.skillExpertise ?? []);
  if (exp.has(key)) {
    exp.delete(key);
    prof.delete(key);
  } else if (prof.has(key)) {
    exp.add(key);
  } else {
    prof.add(key);
  }
  character.value.skillProficiencies = [...prof];
  character.value.skillExpertise = [...exp];
};

const skillBonus = (skill: Skill) => {
  if (!character.value) return 0;
  const mod = abilityModifier(character.value.abilityScores[skill.ability]);
  if (isSkillExpert(skill.key)) return mod + profBonus.value * 2;
  if (isSkillProficient(skill.key)) return mod + profBonus.value;
  return mod;
};

const hpPct = computed(() => {
  if (!character.value || character.value.maxHp <= 0) return 0;
  return Math.max(0, Math.min(100, (character.value.currentHp / character.value.maxHp) * 100));
});

const hpDelta = ref<number>(1);

const adjustHp = (delta: number) => {
  if (!character.value || !delta) return;
  const next = character.value.currentHp + delta;
  character.value.currentHp = Math.max(0, Math.min(character.value.maxHp, next));
  hpDelta.value = 0;
};

const fullRest = () => {
  if (!character.value) return;
  character.value.currentHp = character.value.maxHp;
  character.value.temporaryHp = 0;
  character.value.usedSpellSlots = [];
};

const usedSlots = (level: number) => character.value?.usedSpellSlots?.[level] ?? 0;

const toggleSlot = (level: number, n: number) => {
  if (!character.value) return;
  const used = character.value.usedSpellSlots ? [...character.value.usedSpellSlots] : [];
  while (used.length <= level) used.push(0);
  used[level] = n <= (used[level] ?? 0) ? n - 1 : n;
  character.value.usedSpellSlots = used;
};

const restoreAllSlots = () => {
  if (!character.value) return;
  character.value.usedSpellSlots = [];
};

const exportCharacter = () => {
  if (!character.value) return;
  const data = JSON.stringify(character.value, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${character.value.name || "character"}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

const { confirm: askConfirm } = useConfirm();
const deleteCharacter = async () => {
  if (!character.value) return;
  if (!await askConfirm({ title: `Delete ${character.value.name}?`, message: "This cannot be undone.", confirmLabel: "Delete" })) return;
  remove(character.value.id);
  router.push("/");
};

const shareOpen = ref(false);
const onShareImport = async (incoming: CharacterDraft) => {
  if (!await askConfirm({ title: "Replace character?", message: "Importing will overwrite the current character data.", confirmLabel: "Replace" })) return;
  const merged = { ...incoming, id: character.value!.id };
  character.value = merged;
  shareOpen.value = false;
};
</script>

<style scoped>
.sheet-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  padding: 8px 0 18px;
  border-bottom: 1px solid var(--line);
  margin-bottom: 6px;
}

.header-actions { display: flex; gap: 8px; flex-wrap: wrap; }

.level-input {
  width: 3.2em;
  min-height: auto;
  padding: 1px 4px;
  margin-left: 4px;
  border: 1px solid var(--line);
  border-radius: 3px;
  background: var(--bg-soft);
  font: inherit;
  color: inherit;
  text-align: center;
}
.level-input:focus { box-shadow: none; border-color: var(--gilt); }

.combat-modal-btn {
  width: 100%;
  margin-top: 12px;
  font-family: "IM Fell English SC", serif;
  letter-spacing: 0.16em;
}

.recap-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 12px;
}
.recap-buttons button {
  width: 100%;
  font-family: "IM Fell English SC", serif;
  letter-spacing: 0.16em;
}
@media (max-width: 480px) {
  .recap-buttons { grid-template-columns: 1fr; }
}

.danger-button {
  min-height: 36px;
  padding: 0 14px;
  font-size: 0.78rem;
  background: transparent;
  border-color: var(--rubric-deep);
  color: var(--rubric);
}
.danger-button:hover { background: var(--rubric-deep); color: var(--ink); }

.grid { display: grid; gap: 16px; }

@media (min-width: 760px) {
  .grid { grid-template-columns: 1fr 1fr; }
}

.hp-display {
  text-align: center;
  margin-bottom: 14px;
}

.hp-current {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 6px;
  font-family: "IM Fell English", serif;
}

.hp-num { font-size: 3.4rem; color: var(--ink); line-height: 1; }
.hp-sep { color: var(--ink-faint); font-size: 1.6rem; }
.hp-max { font-size: 1.8rem; color: var(--ink-soft); }

.hp-bar {
  position: relative;
  height: 6px;
  margin: 12px auto 0;
  max-width: 300px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--bg);
  overflow: hidden;
}
.hp-bar span {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, var(--rubric-deep), var(--rubric));
  transition: width 220ms ease;
}

.hp-controls {
  display: grid;
  grid-template-columns: 1fr 80px 1fr;
  gap: 8px;
  margin-bottom: 14px;
}

.hp-controls .full-rest { grid-column: 1 / -1; }

.hp-delta {
  text-align: center;
  font-family: "IM Fell English", serif;
  font-size: 1.1rem;
  padding: 0 4px;
}

.hp-dmg { color: var(--rubric); border-color: var(--rubric-deep); }
.hp-dmg:hover:not(:disabled) { background: var(--rubric-deep); color: var(--ink); }
.hp-heal { color: var(--gilt); border-color: var(--gilt-soft); }
.hp-heal:hover:not(:disabled) { background: var(--gilt-soft); color: var(--ink); }
.hp-controls button:disabled { opacity: 0.4; cursor: not-allowed; }

.hp-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }

.coin-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

@media (min-width: 520px) {
  .coin-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}

.coin {
  display: grid;
  gap: 6px;
  padding: 10px;
  border: 1px solid var(--line);
  border-radius: 4px;
  background: var(--bg-soft);
  text-align: center;
}

.coin > span {
  font-family: "IM Fell English SC", serif;
  font-size: 0.78rem;
  letter-spacing: 0.18em;
}

.coin-cp > span { color: #b08060; }
.coin-sp > span { color: #c9c9c9; }
.coin-gp > span { color: var(--gilt); }
.coin-pp > span { color: #c0d6e0; }

.coin input {
  border: none;
  background: transparent;
  text-align: center;
  font-family: "IM Fell English", serif;
  font-size: 1.4rem;
  padding: 0;
  min-height: auto;
}
.coin input:focus { box-shadow: none; }

.slot-rows { display: grid; gap: 10px; }

.slot-row {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--line);
  border-radius: 4px;
  background: var(--bg-soft);
}

.slot-label {
  font-family: "IM Fell English SC", serif;
  letter-spacing: 0.14em;
  color: var(--gilt);
}

.pips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.pip {
  width: 22px;
  height: 22px;
  min-height: auto;
  padding: 0;
  border-radius: 50%;
  border: 1px solid var(--gilt);
  background: var(--gilt-soft);
  cursor: pointer;
}

.pip.spent { background: transparent; border-style: dashed; border-color: var(--ink-faint); }

.slot-count {
  font-family: "IM Fell English", serif;
  font-size: 0.95rem;
  color: var(--ink-soft);
}

.cast-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0;
  margin: 0;
  border-top: 1px solid var(--line);
}

@media (min-width: 520px) {
  .cast-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}

.cast-grid > div {
  padding: 10px 12px;
  border-bottom: 1px solid var(--line);
  border-right: 1px solid var(--line);
}
.cast-grid > div:last-child { border-right: none; }

.cast-grid dt {
  font-family: "IM Fell English SC", serif;
  font-size: 0.7rem;
  letter-spacing: 0.18em;
  color: var(--gilt);
  text-transform: uppercase;
}

.cast-grid dd {
  margin: 4px 0 0;
  font-family: "IM Fell English", serif;
  font-size: 1.3rem;
}

.spell-known {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 6px;
}

.spell-known li {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid var(--line);
  border-radius: 4px;
  background: var(--bg-soft);
  font-family: "EB Garamond", serif;
}

.spell-known small { color: var(--ink-faint); font-style: italic; }

textarea {
  resize: vertical;
  min-height: 120px;
  font-family: "EB Garamond", serif;
}

.save-status {
  margin-top: 18px;
  text-align: right;
  font-size: 0.82rem;
}

.ability-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

@media (min-width: 760px) {
  .ability-grid { grid-template-columns: repeat(6, minmax(0, 1fr)); }
}

.ability-card {
  display: grid;
  gap: 6px;
  padding: 12px 8px 10px;
  text-align: center;
  border: 1px solid var(--line);
  border-radius: 4px;
  background: var(--bg-panel-2);
  font-family: "IM Fell English SC", serif;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.ability-card > span { font-size: 0.7rem; color: var(--gilt); letter-spacing: 0.22em; }

.ability-card input {
  border: none;
  background: transparent;
  text-align: center;
  font-family: "IM Fell English", serif;
  font-size: 1.6rem;
  color: var(--ink);
  padding: 0;
  min-height: auto;
}
.ability-card input:focus { box-shadow: none; }

.ability-card strong {
  display: inline-block;
  padding: 2px 10px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--bg);
  font-family: "EB Garamond", serif;
  font-weight: 600;
  font-size: 0.92rem;
  letter-spacing: 0;
  color: var(--ink);
}

.ability-card em {
  display: block;
  margin-top: 2px;
  padding: 2px 6px;
  font-size: 0.7rem;
  font-style: normal;
  letter-spacing: 0.1em;
  color: var(--ink-faint);
  border-top: 1px dashed var(--line);
  cursor: pointer;
  transition: color 160ms ease;
}
.ability-card em:hover { color: var(--ink-soft); }
.ability-card em.proficient { color: var(--gilt); border-top-color: var(--gilt-soft); border-top-style: solid; }

.prof-hint { font-size: 0.78rem; align-self: center; }

.skill-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 4px; }

.skill-row {
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr) 40px 44px;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid var(--line-soft);
  border-radius: 4px;
  background: var(--bg-soft);
}
.skill-row .skill-name { min-width: 0; overflow-wrap: anywhere; }

.prof-toggle {
  width: 28px;
  height: 28px;
  min-height: auto;
  padding: 0;
  border-radius: 4px;
  background: transparent;
  border-color: var(--line);
  color: var(--ink-faint);
  font-size: 0.95rem;
  letter-spacing: 0;
}

.prof-toggle.proficient { color: var(--gilt); border-color: var(--gilt-soft); }
.prof-toggle.expert { color: var(--rubric); border-color: var(--rubric); background: rgba(199, 92, 75, 0.08); }

.skill-name { font-family: "EB Garamond", serif; font-size: 1rem; }

.skill-ability {
  font-family: "IM Fell English SC", serif;
  font-size: 0.7rem;
  letter-spacing: 0.16em;
  color: var(--ink-faint);
  text-align: right;
}

.skill-bonus {
  font-family: "IM Fell English", serif;
  font-size: 1.05rem;
  text-align: right;
  color: var(--ink);
}

.feature-group {
  border-top: 1px solid var(--line);
  padding: 10px 0 0;
}
.feature-group:first-of-type { border-top: none; padding-top: 0; }

.feature-group summary {
  display: flex;
  gap: 14px;
  align-items: baseline;
  cursor: pointer;
  padding: 8px 0;
  list-style: none;
}
.feature-group summary::-webkit-details-marker { display: none; }
.feature-group summary::before {
  content: "›";
  display: inline-block;
  color: var(--gilt);
  transition: transform 160ms ease;
  font-size: 1.2rem;
  line-height: 1;
}
.feature-group[open] summary::before { transform: rotate(90deg); }

.feature-group .lvl {
  font-family: "IM Fell English SC", serif;
  letter-spacing: 0.14em;
  color: var(--gilt);
  font-size: 0.78rem;
}

.feature-group .names { color: var(--ink-soft); font-style: italic; }

.feature {
  padding: 4px 0 12px 18px;
  border-left: 1px solid var(--line);
  margin-left: 4px;
}

.feature h3 {
  margin: 6px 0 6px;
  font-family: "IM Fell English", serif;
  font-weight: 400;
  font-size: 1.1rem;
  color: var(--ink);
}
</style>
