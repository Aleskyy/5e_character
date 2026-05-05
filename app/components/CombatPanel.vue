<template>
  <section class="panel">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Battle Stance</p>
        <h2>Combat</h2>
      </div>
      <button type="button" class="ghost-button" :class="{ active: character.inspiration }" @click="character.inspiration = !character.inspiration">
        {{ character.inspiration ? "★ Inspired" : "☆ Inspiration" }}
      </button>
    </div>

    <div class="combat-grid">
      <label class="combat-stat"><span>AC</span><input v-model.number="character.armorClass" type="number" min="0" :placeholder="String(defaultAc)" /></label>
      <label class="combat-stat"><span>Init</span><input v-model.number="character.initiativeBonus" type="number" :placeholder="String(defaultInit)" /></label>
      <label class="combat-stat"><span>Speed</span><input v-model.number="character.speed" type="number" min="0" placeholder="30" /></label>
      <div class="combat-stat passive"><span>P. Perception</span><strong>{{ passive("perception") }}</strong></div>
      <div class="combat-stat passive"><span>P. Insight</span><strong>{{ passive("insight") }}</strong></div>
      <div class="combat-stat passive"><span>P. Investigation</span><strong>{{ passive("investigation") }}</strong></div>
    </div>

    <div class="hd-row">
      <div>
        <p class="eyebrow">Hit Dice</p>
        <p class="hd-text">d{{ hitDieFaces }} · {{ hdRemaining }} / {{ character.level }}</p>
      </div>
      <div class="hd-controls">
        <button type="button" :disabled="hdRemaining <= 0" @click="spendHitDie">Spend</button>
        <button type="button" class="ghost-button" @click="character.hitDiceUsed = 0">Reset</button>
      </div>
    </div>

    <div class="death-saves" v-if="character.currentHp === 0">
      <p class="eyebrow">Death Saves</p>
      <div class="ds-row">
        <span class="ds-label">Successes</span>
        <div class="ds-pips">
          <button v-for="n in 3" :key="n" type="button" class="pip ds-success" :class="{ filled: (character.deathSaves?.successes ?? 0) >= n }" @click="setDS('successes', n)"></button>
        </div>
      </div>
      <div class="ds-row">
        <span class="ds-label">Failures</span>
        <div class="ds-pips">
          <button v-for="n in 3" :key="n" type="button" class="pip ds-failure" :class="{ filled: (character.deathSaves?.failures ?? 0) >= n }" @click="setDS('failures', n)"></button>
        </div>
      </div>
    </div>

    <div class="conc-row">
      <label class="conc-toggle">
        <input type="checkbox" :checked="character.concentration?.active ?? false" @change="toggleConc(($event.target as HTMLInputElement).checked)" />
        <span>Concentration</span>
      </label>
      <input
        v-if="character.concentration?.active"
        type="text"
        class="conc-spell"
        placeholder="Spell name"
        :value="character.concentration?.spellName ?? ''"
        @input="setConcSpell(($event.target as HTMLInputElement).value)"
      />
    </div>

    <div class="status-grid">
      <div class="status-block">
        <p class="eyebrow">Conditions</p>
        <div class="cond-grid">
          <div
            v-for="cond in CONDITIONS"
            :key="cond"
            class="cond-wrap"
            @mouseenter="hoverCond = cond"
            @mouseleave="hoverCond = hoverCond === cond ? null : hoverCond"
          >
            <label class="cond" :class="{ on: character.conditions?.includes(cond) }">
              <input type="checkbox" :checked="character.conditions?.includes(cond) ?? false" @change="toggleCondition(cond)" />
              <span>{{ cond }}</span>
              <button
                type="button"
                class="cond-info"
                aria-label="Show condition info"
                @click.prevent.stop="pinnedCond = pinnedCond === cond ? null : cond"
              >?</button>
            </label>
            <div
              v-if="(hoverCond === cond || pinnedCond === cond) && conditionDataFor(cond)"
              class="cond-tip"
              @click.stop
            >
              <div class="cond-tip-head">
                <strong>{{ conditionDataFor(cond)!.name }}</strong>
                <button type="button" class="cond-tip-close" @click="pinnedCond = null">×</button>
              </div>
              <RuleEntries :entries="(conditionDataFor(cond)!.data.entries ?? []) as any" />
            </div>
          </div>
        </div>
      </div>

      <div class="status-block exhaustion">
        <p class="eyebrow">Exhaustion</p>
        <div class="exh-row">
          <button v-for="n in 6" :key="n" type="button" class="exh-pip" :class="{ on: (character.exhaustion ?? 0) >= n }" @click="setExhaustion(n)">{{ n }}</button>
          <button type="button" class="ghost-button exh-clear" @click="character.exhaustion = 0">Clear</button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { CharacterDraft, Condition } from "~/types/character";
import type { RulesEntity } from "~/types/rules";
import RuleEntries from "~/components/RuleEntries.vue";
import { abilityModifier } from "~/utils/character";
import { CONDITIONS } from "~/utils/dnd-constants";
import { SKILLS } from "~/utils/skills";

type ConditionEntity = RulesEntity<{ page: number | null; entries: unknown[] }>;

const { data: conditionsData } = useFetch<ConditionEntity[]>("/data/conditions.json", { default: () => [], server: false });

const hoverCond = ref<Condition | null>(null);
const pinnedCond = ref<Condition | null>(null);

const conditionDataFor = (cond: Condition) =>
  conditionsData.value.find((c) => c.name.toLowerCase() === cond.toLowerCase());

const props = defineProps<{
  character: CharacterDraft;
  hitDieFaces: number;
  profBonus: number;
}>();

const { items: library, load: loadLibrary } = useItemLibrary();
onMounted(() => loadLibrary());

const equippedAcBonus = computed(() => {
  const inv = props.character.inventory ?? [];
  return inv
    .filter((e) => e.equipped)
    .map((e) => library.value.find((i) => i.id === e.itemId))
    .reduce((sum, item) => sum + (item?.acBonus ?? 0), 0);
});

const defaultAc = computed(() => 10 + abilityModifier(props.character.abilityScores.dex) + equippedAcBonus.value);
const defaultInit = computed(() => abilityModifier(props.character.abilityScores.dex));

const hdRemaining = computed(() => props.character.level - (props.character.hitDiceUsed ?? 0));

const spendHitDie = () => {
  if (hdRemaining.value <= 0) return;
  props.character.hitDiceUsed = (props.character.hitDiceUsed ?? 0) + 1;
};

const passive = (key: "perception" | "insight" | "investigation") => {
  const skill = SKILLS.find((s) => s.key === key)!;
  const mod = abilityModifier(props.character.abilityScores[skill.ability]);
  const isProf = props.character.skillProficiencies?.includes(key) ?? false;
  const isExp = props.character.skillExpertise?.includes(key) ?? false;
  const bonus = isExp ? props.profBonus * 2 : isProf ? props.profBonus : 0;
  return 10 + mod + bonus;
};

const setDS = (kind: "successes" | "failures", n: number) => {
  const ds = props.character.deathSaves ?? { successes: 0, failures: 0 };
  const next = { ...ds };
  next[kind] = ds[kind] === n ? n - 1 : n;
  props.character.deathSaves = next;
};

const toggleCondition = (cond: Condition) => {
  const list = new Set(props.character.conditions ?? []);
  if (list.has(cond)) list.delete(cond); else list.add(cond);
  props.character.conditions = [...list];
};

const setExhaustion = (n: number) => {
  props.character.exhaustion = (props.character.exhaustion ?? 0) === n ? n - 1 : n;
};

const toggleConc = (active: boolean) => {
  props.character.concentration = active
    ? { active: true, spellName: props.character.concentration?.spellName ?? "" }
    : { active: false };
};

const setConcSpell = (name: string) => {
  props.character.concentration = { active: true, spellName: name };
};
</script>

<style scoped>
.combat-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 16px;
}

.combat-stat {
  display: grid;
  gap: 4px;
  padding: 10px;
  border: 1px solid var(--line);
  border-radius: 4px;
  background: var(--bg-soft);
  text-align: center;
}

.combat-stat span {
  font-family: "IM Fell English SC", serif;
  font-size: 0.7rem;
  letter-spacing: 0.18em;
  color: var(--gilt);
}

.combat-stat input {
  border: none;
  background: transparent;
  text-align: center;
  font-family: "IM Fell English", serif;
  font-size: 1.5rem;
  padding: 0;
  min-height: auto;
}
.combat-stat input:focus { box-shadow: none; }

.combat-stat.passive strong {
  font-family: "IM Fell English", serif;
  font-size: 1.5rem;
  font-weight: 400;
  color: var(--ink);
}

.ghost-button.active { color: var(--gilt); border-color: var(--gilt); }

.hd-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid var(--line);
  border-radius: 4px;
  background: var(--bg-soft);
  margin-bottom: 14px;
}
.hd-text { margin: 4px 0 0; font-family: "IM Fell English", serif; font-size: 1.1rem; }
.hd-controls { display: flex; gap: 8px; }

.death-saves {
  padding: 12px 14px;
  margin-bottom: 14px;
  border: 1px solid var(--rubric-deep);
  border-radius: 4px;
  background: rgba(199, 92, 75, 0.06);
}
.ds-row { display: flex; align-items: center; gap: 12px; margin-top: 6px; }
.ds-label { font-family: "IM Fell English SC", serif; font-size: 0.78rem; letter-spacing: 0.14em; min-width: 90px; }
.ds-pips { display: flex; gap: 6px; }
.pip { width: 22px; height: 22px; min-height: auto; padding: 0; border-radius: 50%; border: 1px solid var(--line); background: transparent; }
.pip.ds-success.filled { background: var(--moss); border-color: var(--moss); }
.pip.ds-failure.filled { background: var(--rubric); border-color: var(--rubric); }

.conc-row {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 14px;
}
.conc-toggle { display: flex; align-items: center; gap: 8px; flex-direction: row; text-transform: none; letter-spacing: 0; font-size: 0.95rem; }
.conc-toggle input { width: 18px; min-height: 18px; accent-color: var(--gilt); }
.conc-spell { flex: 1; }

.status-grid {
  display: grid;
  gap: 14px;
}

.status-block .eyebrow { margin-bottom: 8px; }

.cond-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4px;
}

@media (min-width: 520px) { .cond-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }

.cond {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border: 1px solid var(--line-soft);
  border-radius: 3px;
  background: var(--bg-soft);
  font-size: 0.9rem;
  text-transform: capitalize;
  letter-spacing: 0;
  cursor: pointer;
}
.cond.on { border-color: var(--rubric); background: rgba(199, 92, 75, 0.1); color: var(--ink); }
.cond input { width: 14px; min-height: 14px; accent-color: var(--rubric); }

.cond-wrap { position: relative; }
.cond-info {
  margin-left: auto;
  width: 18px;
  height: 18px;
  min-height: auto;
  padding: 0;
  border-radius: 50%;
  border: 1px solid var(--line);
  background: transparent;
  color: var(--ink-faint);
  font-size: 0.7rem;
  line-height: 1;
  cursor: help;
}
.cond-info:hover { color: var(--gilt); border-color: var(--gilt); }

.cond-tip {
  position: absolute;
  z-index: 20;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  min-width: 240px;
  max-width: 360px;
  padding: 10px 12px;
  border: 1px solid var(--gilt);
  border-radius: 4px;
  background: var(--bg-panel-2, var(--bg-soft));
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  font-size: 0.85rem;
  text-transform: none;
  letter-spacing: 0;
  color: var(--ink);
}
.cond-tip-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.cond-tip-close { background: transparent; border: none; color: var(--ink-faint); font-size: 1.2rem; padding: 0 4px; cursor: pointer; min-height: auto; }

.exh-row { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
.exh-pip {
  width: 32px; height: 32px; min-height: auto; padding: 0;
  border-radius: 4px; background: transparent; border-color: var(--line);
  font-family: "IM Fell English", serif;
}
.exh-pip.on { background: var(--rubric-deep); border-color: var(--rubric); color: var(--ink); }
.exh-clear { margin-left: auto; }
</style>
