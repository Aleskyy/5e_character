<template>
  <Teleport to="body">
    <div v-if="open" class="modal-backdrop" @click.self="$emit('close')">
      <div class="modal" role="dialog" aria-label="Combat overview">
        <header class="modal-head">
          <div>
            <p class="eyebrow">Battle Sheet</p>
            <h2>{{ character.name || "Unnamed" }} · Lv {{ character.level }}</h2>
          </div>
          <button type="button" class="modal-close" @click="$emit('close')" aria-label="Close">×</button>
        </header>

        <div class="modal-body">
          <section class="block">
            <p class="eyebrow">Vitals</p>
            <dl class="kv">
              <div><dt>HP</dt><dd>{{ character.currentHp }} / {{ character.maxHp }}<small v-if="character.temporaryHp"> +{{ character.temporaryHp }} tmp</small></dd></div>
              <div><dt>AC</dt><dd>{{ ac }}</dd></div>
              <div><dt>Init</dt><dd>{{ signed(init) }}</dd></div>
              <div><dt>Speed</dt><dd>{{ character.speed || 30 }}</dd></div>
              <div><dt>Prof</dt><dd>{{ signed(profBonus) }}</dd></div>
              <div><dt>Hit Dice</dt><dd>{{ hdRemaining }} / {{ character.level }}</dd></div>
              <div v-if="character.inspiration"><dt>Inspiration</dt><dd>★</dd></div>
              <div v-if="character.concentration?.active"><dt>Concentration</dt><dd>{{ character.concentration.spellName || "—" }}</dd></div>
            </dl>
          </section>

          <section class="block">
            <p class="eyebrow">Saves</p>
            <ul class="inline">
              <li v-for="ab in abilities" :key="ab"><span>{{ ab.toUpperCase() }}</span><strong>{{ signed(saveBonus(ab)) }}</strong></li>
            </ul>
          </section>

          <section class="block">
            <p class="eyebrow">Passives</p>
            <ul class="inline">
              <li><span>Perception</span><strong>{{ passive("perception") }}</strong></li>
              <li><span>Insight</span><strong>{{ passive("insight") }}</strong></li>
              <li><span>Investigation</span><strong>{{ passive("investigation") }}</strong></li>
            </ul>
          </section>

          <section v-if="spellSaveDc !== null" class="block">
            <p class="eyebrow">Spellcasting</p>
            <dl class="kv">
              <div><dt>Save DC</dt><dd>{{ spellSaveDc }}</dd></div>
              <div><dt>Attack</dt><dd>{{ signed(spellAttackBonus ?? 0) }}</dd></div>
              <div><dt>Ability</dt><dd>{{ spellcastingAbility?.toUpperCase() }}</dd></div>
            </dl>
          </section>

          <section v-if="spellSlots.length" class="block">
            <div class="slot-head">
              <p class="eyebrow">Spell Slots</p>
              <button type="button" class="ghost-button slot-restore" @click="restoreAll">Restore all</button>
            </div>
            <ul class="slot-rows">
              <li v-for="(total, idx) in spellSlots" v-show="total > 0" :key="idx" class="slot-row">
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
              </li>
            </ul>
          </section>

          <section class="block">
            <p class="eyebrow">Attacks</p>
            <ul v-if="attacks.length" class="atk-list">
              <li v-for="(atk, i) in attacks" :key="i">
                <span class="atk-name">{{ atk.name }}</span>
                <span>{{ signed(atk.attackBonus) }}</span>
                <span>{{ atk.damage }}<small v-if="atk.damageType"> {{ atk.damageType }}</small></span>
              </li>
            </ul>
            <p v-else class="muted">No equipped weapons.</p>
          </section>

          <section v-if="preparedSpells.length" class="block">
            <p class="eyebrow">Prepared Spells</p>
            <ul class="spells">
              <li v-for="grp in preparedByLevel" :key="grp.level">
                <strong>{{ grp.level === 0 ? "Cantrips" : `Lv ${grp.level}` }}:</strong>
                <span>{{ grp.spells.map(s => s.name).join(", ") }}</span>
              </li>
            </ul>
          </section>

          <section v-if="(character.conditions ?? []).length || (character.exhaustion ?? 0) > 0" class="block warn">
            <p class="eyebrow">Active Conditions</p>
            <p>
              <span v-for="c in character.conditions ?? []" :key="c" class="cond-tag">{{ c }}</span>
              <span v-if="(character.exhaustion ?? 0) > 0" class="cond-tag exh">Exhaustion {{ character.exhaustion }}</span>
            </p>
          </section>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { CharacterDraft } from "~/types/character";
import type { Ability, ClassData, RulesEntity, SpellData, SubclassData } from "~/types/rules";
import { abilities, abilityModifier, signed, spellSlotsForLevel } from "~/utils/character";
import { SKILLS } from "~/utils/skills";

const props = defineProps<{
  open: boolean;
  character: CharacterDraft;
  profBonus: number;
  selectedClass?: RulesEntity<ClassData>;
  selectedSubclass?: RulesEntity<SubclassData>;
  spells: RulesEntity<SpellData>[];
}>();

defineEmits<{ (e: "close"): void }>();

const { items: library, load: loadLib } = useItemLibrary();
onMounted(() => loadLib());

const equippedAcBonus = computed(() =>
  (props.character.inventory ?? [])
    .filter((e) => e.equipped)
    .map((e) => library.value.find((i) => i.id === e.itemId))
    .reduce((sum, item) => sum + (item?.acBonus ?? 0), 0),
);

const ac = computed(() => props.character.armorClass || 10 + abilityModifier(props.character.abilityScores.dex) + equippedAcBonus.value);
const init = computed(() => props.character.initiativeBonus ?? abilityModifier(props.character.abilityScores.dex));

const hdRemaining = computed(() => props.character.level - (props.character.hitDiceUsed ?? 0));

const isSaveProficient = (ab: Ability) => {
  const explicit = props.character.savingThrowProficiencies;
  if (explicit && explicit.length) return explicit.includes(ab);
  return props.selectedClass?.data.savingThrowProficiencies?.includes(ab) ?? false;
};
const saveBonus = (ab: Ability) =>
  abilityModifier(props.character.abilityScores[ab]) + (isSaveProficient(ab) ? props.profBonus : 0);

const passive = (key: "perception" | "insight" | "investigation") => {
  const skill = SKILLS.find((s) => s.key === key)!;
  const mod = abilityModifier(props.character.abilityScores[skill.ability]);
  const isProf = props.character.skillProficiencies?.includes(key) ?? false;
  const isExp = props.character.skillExpertise?.includes(key) ?? false;
  const bonus = isExp ? props.profBonus * 2 : isProf ? props.profBonus : 0;
  return 10 + mod + bonus;
};

const spellSlots = computed(() => spellSlotsForLevel(props.selectedClass, props.character.level));
const usedSlots = (lvl: number) => props.character.usedSpellSlots?.[lvl] ?? 0;

const toggleSlot = (level: number, n: number) => {
  const used = props.character.usedSpellSlots ? [...props.character.usedSpellSlots] : [];
  while (used.length <= level) used.push(0);
  used[level] = n <= (used[level] ?? 0) ? n - 1 : n;
  props.character.usedSpellSlots = used;
};

const restoreAll = () => { props.character.usedSpellSlots = []; };

const spellcastingAbility = computed(() => props.selectedClass?.data.spellcastingAbility ?? null);
const spellcastingMod = computed(() =>
  spellcastingAbility.value ? abilityModifier(props.character.abilityScores[spellcastingAbility.value]) : 0,
);
const spellAttackBonus = computed(() => spellcastingAbility.value ? spellcastingMod.value + props.profBonus : null);
const spellSaveDc = computed(() => spellAttackBonus.value === null ? null : spellAttackBonus.value + 8);

const knownSpells = computed(() => {
  const ids = new Set(props.character.selectedSpellIds);
  return props.spells.filter((s) => ids.has(s.id));
});

const preparedSpells = computed(() => {
  const explicit = new Set([
    ...(props.character.preparedSpellIds ?? []),
    ...knownSpells.value.filter((s) => s.data.level === 0).map((s) => s.id),
  ]);
  return knownSpells.value
    .filter((s) => explicit.has(s.id))
    .sort((a, b) => a.data.level - b.data.level || a.name.localeCompare(b.name));
});

const preparedByLevel = computed(() => {
  const map = new Map<number, typeof preparedSpells.value>();
  for (const s of preparedSpells.value) {
    if (!map.has(s.data.level)) map.set(s.data.level, [] as any);
    map.get(s.data.level)!.push(s);
  }
  return [...map.entries()].sort((a, b) => a[0] - b[0]).map(([level, spells]) => ({ level, spells }));
});

const attacks = computed(() => {
  return (props.character.inventory ?? [])
    .filter((e) => e.equipped)
    .map((e) => library.value.find((i) => i.id === e.itemId))
    .filter((it): it is NonNullable<typeof it> => !!it && it.type === "weapon")
    .map((it) => {
      const ability = it.damageAbility ?? "str";
      const mod = abilityModifier(props.character.abilityScores[ability]);
      return {
        name: it.name,
        attackBonus: mod + props.profBonus,
        damage: it.damage ? `${it.damage}${signed(mod)}` : signed(mod),
        damageType: it.damageType ?? "",
      };
    });
});
</script>

<style scoped>
.modal-backdrop {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(0, 0, 0, 0.7);
  display: grid; place-items: center;
  padding: 16px;
  overflow-y: auto;
}
.modal {
  width: min(720px, 100%);
  max-height: 90vh;
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
.modal-close {
  background: transparent; border: none; color: var(--ink-faint);
  font-size: 1.6rem; line-height: 1; padding: 0 8px; min-height: auto; cursor: pointer;
}
.modal-close:hover { color: var(--ink); }
.modal-body { padding: 16px 20px; display: grid; gap: 18px; }

.block .eyebrow { margin: 0 0 8px; }

.kv { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 0; margin: 0; border: 1px solid var(--line); border-radius: 4px; overflow: hidden; }
.kv > div { padding: 8px 12px; border-right: 1px solid var(--line); border-bottom: 1px solid var(--line); background: var(--bg-soft); }
.kv dt { font-family: "IM Fell English SC", serif; font-size: 0.7rem; letter-spacing: 0.16em; color: var(--gilt); text-transform: uppercase; }
.kv dd { margin: 4px 0 0; font-family: "IM Fell English", serif; font-size: 1.2rem; }

.inline { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 8px; }
.inline li { padding: 6px 10px; border: 1px solid var(--line); border-radius: 4px; background: var(--bg-soft); display: flex; gap: 8px; align-items: baseline; }
.inline li span { font-family: "IM Fell English SC", serif; font-size: 0.7rem; letter-spacing: 0.14em; color: var(--ink-faint); }
.inline li strong { font-family: "IM Fell English", serif; font-weight: 400; font-size: 1rem; }

.slot-head { display: flex; justify-content: space-between; align-items: center; }
.slot-restore { font-size: 0.75rem; min-height: 30px; padding: 0 10px; }

.slot-rows { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
.slot-row {
  display: grid;
  grid-template-columns: 40px 1fr auto;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border: 1px solid var(--gilt-soft);
  border-radius: 4px;
  background: rgba(201, 161, 85, 0.06);
}
.slot-label { font-family: "IM Fell English SC", serif; letter-spacing: 0.14em; color: var(--gilt); }
.pips { display: flex; flex-wrap: wrap; gap: 6px; }
.pip {
  width: 22px; height: 22px; min-height: auto; padding: 0;
  border-radius: 50%;
  border: 1px solid var(--gilt);
  background: var(--gilt-soft);
  cursor: pointer;
}
.pip.spent { background: transparent; border-style: dashed; border-color: var(--ink-faint); }
.slot-count { font-family: "IM Fell English", serif; font-size: 0.95rem; color: var(--ink-soft); }

.atk-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
.atk-list li { display: grid; grid-template-columns: 1fr auto auto; gap: 12px; padding: 8px 12px; border: 1px solid var(--line); border-radius: 4px; background: var(--bg-soft); font-family: "EB Garamond", serif; }
.atk-list .atk-name { font-weight: 600; }
.atk-list small { color: var(--ink-faint); font-style: italic; }

.spells { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; font-family: "EB Garamond", serif; }
.spells li { padding: 8px 12px; border: 1px solid var(--line); border-radius: 4px; background: var(--bg-soft); }
.spells strong { color: var(--gilt); margin-right: 6px; }

.warn { padding: 12px; border: 1px solid var(--rubric-deep); border-radius: 4px; background: rgba(199, 92, 75, 0.06); }
.cond-tag { display: inline-block; margin: 2px 4px 2px 0; padding: 2px 8px; border: 1px solid var(--rubric); border-radius: 999px; background: rgba(199, 92, 75, 0.1); color: var(--ink); font-size: 0.85rem; text-transform: capitalize; }
.cond-tag.exh { border-color: var(--gilt); color: var(--gilt); background: rgba(201, 161, 85, 0.08); }
</style>
