<template>
  <section class="panel">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Steel</p>
        <h2>Attacks</h2>
      </div>
      <span class="muted">From equipped weapons</span>
    </div>

    <dl v-if="bestAttack" class="atk-summary">
      <div><dt>Best Attack</dt><dd>{{ signed(bestAttack.attackBonus) }}</dd></div>
      <div><dt>Best Damage</dt><dd>{{ bestAttack.damage }}<small v-if="bestAttack.damageType"> {{ bestAttack.damageType }}</small></dd></div>
      <div><dt>Prof.</dt><dd>{{ signed(profBonus) }}</dd></div>
    </dl>

    <ul v-if="attacks.length" class="atk-list">
      <li v-for="atk in attacks" :key="atk.id" class="atk-row">
        <span class="atk-name">{{ atk.name }}</span>
        <span class="atk-bonus">{{ signed(atk.attackBonus) }}</span>
        <span class="atk-damage">{{ atk.damage }}<small v-if="atk.damageType"> {{ atk.damageType }}</small></span>
      </li>
    </ul>
    <p v-else class="muted">Equip a weapon in Inventory to see attack rolls.</p>
  </section>
</template>

<script setup lang="ts">
import type { CharacterDraft } from "~/types/character";
import { abilityModifier, signed } from "~/utils/character";

const props = defineProps<{ character: CharacterDraft; profBonus: number }>();

const { items: library, load } = useItemLibrary();
onMounted(() => load());

const bestAttack = computed(() => {
  if (!attacks.value.length) return null;
  return [...attacks.value].sort((a, b) => b.attackBonus - a.attackBonus)[0];
});

const attacks = computed(() => {
  const inv = props.character.inventory ?? [];
  return inv
    .filter((e) => e.equipped)
    .map((e) => library.value.find((i) => i.id === e.itemId))
    .filter((it): it is NonNullable<typeof it> => !!it && it.type === "weapon")
    .map((it, idx) => {
      const ability = it.damageAbility ?? "str";
      const mod = abilityModifier(props.character.abilityScores[ability]);
      const isProf = props.character.weaponProficiencies?.length
        ? true
        : false;
      const bonus = mod + (isProf ? props.profBonus : 0);
      const dmgBonus = mod >= 0 ? `+${mod}` : String(mod);
      return {
        id: `${it.id}-${idx}`,
        name: it.name,
        attackBonus: bonus,
        damage: it.damage ? `${it.damage}${mod !== 0 ? ` ${dmgBonus}` : ""}` : dmgBonus,
        damageType: it.damageType ?? "",
      };
    });
});
</script>

<style scoped>
.atk-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0;
  margin: 0 0 14px;
  border-top: 1px solid var(--line);
}
.atk-summary > div {
  padding: 10px 12px;
  border-bottom: 1px solid var(--line);
  border-right: 1px solid var(--line);
}
.atk-summary > div:last-child { border-right: none; }
.atk-summary dt {
  font-family: "IM Fell English SC", serif;
  font-size: 0.7rem;
  letter-spacing: 0.18em;
  color: var(--gilt);
  text-transform: uppercase;
}
.atk-summary dd {
  margin: 4px 0 0;
  font-family: "IM Fell English", serif;
  font-size: 1.3rem;
}
.atk-summary small { font-size: 0.92rem; color: var(--ink-faint); font-style: italic; }

.atk-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
.atk-row {
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--line);
  border-radius: 4px;
  background: var(--bg-soft);
  font-family: "EB Garamond", serif;
}
@media (min-width: 520px) {
  .atk-row { grid-template-columns: 1fr 70px 1fr; gap: 12px; }
}
.atk-name { font-size: 1.05rem; min-width: 0; overflow-wrap: anywhere; }
.atk-bonus {
  text-align: center;
  font-family: "IM Fell English", serif;
  font-size: 1.2rem;
  color: var(--gilt);
  min-width: 48px;
}
.atk-damage { text-align: right; white-space: nowrap; }
.atk-damage small { color: var(--ink-faint); font-style: italic; }
</style>
