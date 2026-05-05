<template>
  <section class="top-stats">
    <div class="bigs">
      <a class="big hp" href="#vitals">
        <span class="lbl">HP</span>
        <span class="val">{{ character.currentHp }}<small>/{{ character.maxHp }}</small></span>
        <span class="bar"><span :style="{ width: hpPct + '%' }"></span></span>
      </a>
      <a class="big ac" href="#combat">
        <span class="lbl">AC</span>
        <span class="val">{{ effectiveAc }}</span>
      </a>
      <a class="big init" href="#combat">
        <span class="lbl">Init</span>
        <span class="val">{{ signed(initBonus) }}</span>
      </a>
      <a class="big speed" href="#combat">
        <span class="lbl">Speed</span>
        <span class="val">{{ character.speed ?? 30 }}<small>ft</small></span>
      </a>
      <a class="big prof" href="#abilities">
        <span class="lbl">Prof</span>
        <span class="val">{{ signed(profBonus) }}</span>
      </a>
    </div>

    <div class="abilities-strip">
      <a v-for="ability in abilities" :key="ability" class="ab" href="#abilities">
        <span class="ab-name">{{ ability.toUpperCase() }}</span>
        <span class="ab-mod">{{ signed(abilityModifier(character.abilityScores[ability])) }}</span>
        <span class="ab-score">{{ character.abilityScores[ability] }}</span>
      </a>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { CharacterDraft } from "~/types/character";
import { abilities, abilityModifier, signed } from "~/utils/character";

const props = defineProps<{
  character: CharacterDraft;
  profBonus: number;
  equippedAcBonus: number;
}>();

const hpPct = computed(() => {
  if (props.character.maxHp <= 0) return 0;
  return Math.max(0, Math.min(100, (props.character.currentHp / props.character.maxHp) * 100));
});

const effectiveAc = computed(() => {
  if (props.character.armorClass != null) return props.character.armorClass + props.equippedAcBonus;
  return 10 + abilityModifier(props.character.abilityScores.dex) + props.equippedAcBonus;
});

const initBonus = computed(() =>
  props.character.initiativeBonus ?? abilityModifier(props.character.abilityScores.dex),
);
</script>

<style scoped>
.top-stats {
  display: grid;
  gap: 12px;
  margin-top: 16px;
  padding: 16px;
  border: 1px solid var(--gilt-soft);
  border-radius: 6px;
  background: linear-gradient(180deg, var(--bg-panel) 0%, var(--bg-soft) 100%);
  box-shadow: 0 12px 30px -16px rgba(0, 0, 0, 0.55);
  scroll-margin-top: 24px;
}

.bigs {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
  gap: 8px;
}

@media (max-width: 600px) {
  .bigs { grid-template-columns: 1fr 1fr 1fr; }
  .bigs .hp { grid-column: 1 / -1; }
}

.big {
  position: relative;
  display: grid;
  gap: 4px;
  padding: 12px 14px;
  border: 1px solid var(--line);
  border-radius: 4px;
  background: var(--bg-soft);
  text-align: center;
  text-decoration: none;
  color: var(--ink);
  transition: border-color 160ms ease, transform 160ms ease;
}
.big:hover { border-color: var(--gilt); transform: translateY(-1px); }

.big .lbl {
  font-family: "IM Fell English SC", serif;
  font-size: 0.7rem;
  letter-spacing: 0.2em;
  color: var(--gilt);
  text-transform: uppercase;
}

.big .val {
  font-family: "IM Fell English", serif;
  font-size: 1.8rem;
  line-height: 1;
}

.big .val small {
  font-size: 1rem;
  color: var(--ink-faint);
  margin-left: 2px;
}

.big.hp .val { font-size: 2.4rem; }

.big.hp .bar {
  display: block;
  height: 5px;
  margin-top: 6px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--bg);
  overflow: hidden;
}
.big.hp .bar > span {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, var(--rubric-deep), var(--rubric));
  transition: width 220ms ease;
}

.abilities-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
}
@media (min-width: 600px) {
  .abilities-strip { grid-template-columns: repeat(6, minmax(0, 1fr)); }
}

.ab {
  display: grid;
  gap: 2px;
  padding: 8px 6px;
  border: 1px solid var(--line);
  border-radius: 4px;
  background: var(--bg-soft);
  text-align: center;
  text-decoration: none;
  color: var(--ink);
}
.ab:hover { border-color: var(--gilt-soft); }

.ab-name {
  font-family: "IM Fell English SC", serif;
  font-size: 0.66rem;
  letter-spacing: 0.18em;
  color: var(--gilt);
}

.ab-mod {
  font-family: "IM Fell English", serif;
  font-size: 1.3rem;
}

.ab-score { color: var(--ink-faint); font-size: 0.78rem; font-style: italic; }
</style>
