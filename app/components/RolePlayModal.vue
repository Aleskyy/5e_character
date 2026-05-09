<template>
  <Teleport to="body">
    <div v-if="open" class="modal-backdrop" @click.self="$emit('close')">
      <div class="modal" role="dialog" aria-label="Roleplay overview">
        <header class="modal-head">
          <div>
            <p class="eyebrow">Roleplay</p>
            <h2>{{ character.name || "Unnamed" }}</h2>
            <p class="sub" v-if="raceLabel">{{ raceLabel }} · Lv {{ character.level }}</p>
          </div>
          <button type="button" class="modal-close" @click="$emit('close')" aria-label="Close">×</button>
        </header>

        <div class="modal-body">
          <section class="block">
            <p class="eyebrow">Languages</p>
            <ul v-if="languages.length" class="chip-list">
              <li v-for="l in languages" :key="l">{{ l }}</li>
            </ul>
            <p v-else class="muted">None recorded.</p>
          </section>

          <section class="block">
            <p class="eyebrow">Tools &amp; Instruments</p>
            <ul v-if="tools.length" class="chip-list">
              <li v-for="t in tools" :key="t">{{ t }}</li>
            </ul>
            <p v-else class="muted">None recorded.</p>
          </section>

          <section class="block">
            <p class="eyebrow">Social Skills</p>
            <ul class="inline">
              <li v-for="s in socialSkills" :key="s.key">
                <span>{{ s.name }}</span><strong>{{ signed(skillBonusOf(s)) }}</strong>
              </li>
            </ul>
            <p class="passive">Passive Insight <strong>{{ 10 + skillBonusOf(insightSkill) }}</strong></p>
          </section>

          <section class="block">
            <button type="button" class="primary-button wide" @click="goRelations">View All Relations →</button>
          </section>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { CharacterDraft } from "~/types/character";
import { abilityModifier, signed } from "~/utils/character";
import { SKILLS, type Skill } from "~/utils/skills";

const props = defineProps<{
  open: boolean;
  character: CharacterDraft;
  raceLabel?: string;
  profBonus: number;
}>();

const emit = defineEmits<{ (e: "close"): void }>();

const languages = computed(() => props.character.languages ?? []);
const tools = computed(() => props.character.toolProficiencies ?? []);

const SOCIAL_KEYS = ["persuasion", "deception", "insight", "intimidation", "performance"] as const;
const socialSkills = computed(() =>
  SOCIAL_KEYS.map((k) => SKILLS.find((s) => s.key === k)!).filter(Boolean),
);
const insightSkill = SKILLS.find((s) => s.key === "insight")!;

const isProf = (key: string) => (props.character.skillProficiencies ?? []).includes(key);
const isExp = (key: string) => (props.character.skillExpertise ?? []).includes(key);

const skillBonusOf = (skill: Skill) => {
  const mod = abilityModifier(props.character.abilityScores[skill.ability]);
  if (isExp(skill.key)) return mod + props.profBonus * 2;
  if (isProf(skill.key)) return mod + props.profBonus;
  return mod;
};

const goRelations = () => {
  emit("close");
  nextTick(() => {
    const el = document.getElementById("relations");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  });
};
</script>

<style scoped>
.modal-backdrop {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(0, 0, 0, 0.7);
  display: grid; place-items: center;
  padding: 16px;
  overflow-y: auto;
}
@media (max-width: 520px) { .modal-backdrop { padding: 8px; } }
.modal {
  width: min(640px, 100%);
  max-height: 90dvh;
  overflow-y: auto;
  background: var(--bg-panel-2, var(--bg-soft));
  border: 1px solid var(--gilt);
  border-radius: 6px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6);
}
.modal-head {
  display: flex; justify-content: space-between; align-items: flex-start;
  padding: 16px 20px;
  border-bottom: 1px solid var(--line);
  position: sticky; top: 0;
  background: inherit; z-index: 1;
}
.modal-head h2 { margin: 4px 0 0; font-family: "IM Fell English", serif; font-weight: 400; font-size: 1.4rem; }
.sub { margin: 4px 0 0; color: var(--ink-soft); font-style: italic; font-size: 0.92rem; }
.modal-close {
  background: transparent; border: none; color: var(--ink-faint);
  font-size: 1.6rem; line-height: 1; padding: 0 8px; min-height: auto; cursor: pointer;
}
.modal-close:hover { color: var(--ink); }
.modal-body { padding: 16px 20px; display: grid; gap: 18px; }
.block .eyebrow { margin: 0 0 8px; }

.chip-list { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 6px; }
.chip-list li {
  padding: 4px 10px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--bg-soft);
  font-family: "EB Garamond", serif;
  font-size: 0.92rem;
}

.inline { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 8px; }
.inline li { padding: 6px 10px; border: 1px solid var(--line); border-radius: 4px; background: var(--bg-soft); display: flex; gap: 8px; align-items: baseline; }
.inline li span { font-family: "IM Fell English SC", serif; font-size: 0.7rem; letter-spacing: 0.14em; color: var(--ink-faint); }
.inline li strong { font-family: "IM Fell English", serif; font-weight: 400; font-size: 1rem; color: var(--gilt); }

.passive { margin: 10px 0 0; font-family: "EB Garamond", serif; color: var(--ink-soft); }
.passive strong { color: var(--gilt); margin-left: 6px; font-family: "IM Fell English", serif; }

.muted { color: var(--ink-faint); font-style: italic; margin: 0; }

.wide { width: 100%; font-family: "IM Fell English SC", serif; letter-spacing: 0.16em; }
</style>
