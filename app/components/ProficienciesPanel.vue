<template>
  <section class="panel">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Lore</p>
        <h2>Proficiencies &amp; Languages</h2>
      </div>
    </div>

    <div class="prof-grid">
      <div>
        <p class="eyebrow">Languages</p>
        <ChipList
          :model-value="character.languages ?? []"
          :suggestions="COMMON_LANGUAGES"
          placeholder="Add language…"
          @update:model-value="character.languages = $event"
        />
      </div>

      <div>
        <p class="eyebrow">Tools</p>
        <ChipList
          :model-value="character.toolProficiencies ?? []"
          :suggestions="TOOLS"
          placeholder="Add tool…"
          @update:model-value="character.toolProficiencies = $event"
        />
      </div>

      <div>
        <p class="eyebrow">Weapon Categories</p>
        <div class="check-grid">
          <label v-for="cat in WEAPON_CATEGORIES" :key="cat" class="check-row" :class="{ on: hasWeapon(cat) }">
            <input type="checkbox" :checked="hasWeapon(cat)" @change="toggleWeapon(cat)" />
            <span>{{ cat }}</span>
          </label>
        </div>
        <ChipList
          :model-value="weaponSpecific"
          placeholder="Specific weapons…"
          @update:model-value="setSpecific($event, 'weapon')"
        />
      </div>

      <div>
        <p class="eyebrow">Armor</p>
        <div class="check-grid">
          <label v-for="cat in ARMOR_CATEGORIES" :key="cat" class="check-row" :class="{ on: hasArmor(cat) }">
            <input type="checkbox" :checked="hasArmor(cat)" @change="toggleArmor(cat)" />
            <span>{{ cat }}</span>
          </label>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { CharacterDraft } from "~/types/character";
import {
  ARMOR_CATEGORIES, COMMON_LANGUAGES, TOOLS, WEAPON_CATEGORIES,
} from "~/utils/dnd-constants";

const props = defineProps<{ character: CharacterDraft }>();

const hasWeapon = (cat: string) => props.character.weaponProficiencies?.includes(cat) ?? false;
const hasArmor = (cat: string) => props.character.armorProficiencies?.includes(cat) ?? false;

const toggleWeapon = (cat: string) => {
  const set = new Set(props.character.weaponProficiencies ?? []);
  if (set.has(cat)) set.delete(cat); else set.add(cat);
  props.character.weaponProficiencies = [...set];
};

const toggleArmor = (cat: string) => {
  const set = new Set(props.character.armorProficiencies ?? []);
  if (set.has(cat)) set.delete(cat); else set.add(cat);
  props.character.armorProficiencies = [...set];
};

const weaponSpecific = computed(() =>
  (props.character.weaponProficiencies ?? []).filter((p) => !WEAPON_CATEGORIES.includes(p)),
);

const setSpecific = (specifics: string[], _kind: "weapon") => {
  const cats = (props.character.weaponProficiencies ?? []).filter((p) => WEAPON_CATEGORIES.includes(p));
  props.character.weaponProficiencies = [...cats, ...specifics];
};
</script>

<style scoped>
.prof-grid {
  display: grid;
  gap: 14px;
}
@media (min-width: 760px) { .prof-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }

.eyebrow { margin-bottom: 6px; }

.check-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
  margin-bottom: 10px;
}

.check-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid var(--line);
  border-radius: 4px;
  background: var(--bg-soft);
  text-transform: none;
  letter-spacing: 0;
  font-size: 0.92rem;
  cursor: pointer;
}
.check-row.on { border-color: var(--gilt); background: rgba(201, 161, 85, 0.08); color: var(--ink); }
.check-row input { width: 16px; min-height: 16px; accent-color: var(--gilt); }
</style>
