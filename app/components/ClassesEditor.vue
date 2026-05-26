<template>
  <div class="classes-editor">
    <div v-for="(entry, idx) in modelValue" :key="idx" class="class-row">
      <label class="cls">Class
        <select
          :value="entry.classId"
          @change="updateEntry(idx, { classId: ($event.target as HTMLSelectElement).value, subclassId: '' })"
        >
          <option value="">Choose a class</option>
          <option v-for="o in classOptions" :key="o.id" :value="o.id">
            {{ o.name }} ({{ o.source }}){{ o.sourceType === 'ua' ? ' [UA]' : '' }}
          </option>
        </select>
      </label>

      <label class="sub">Subclass
        <select
          :value="entry.subclassId"
          :disabled="!subclassOptionsFor(entry.classId).length"
          @change="updateEntry(idx, { subclassId: ($event.target as HTMLSelectElement).value })"
        >
          <option value="">Choose a subclass</option>
          <option v-for="o in subclassOptionsFor(entry.classId)" :key="o.id" :value="o.id">
            {{ o.name }} ({{ o.source }})
          </option>
        </select>
      </label>

      <label class="lvl">Level
        <input
          type="number" min="1" max="20"
          :value="entry.level"
          @input="updateEntry(idx, { level: clampLevel(Number(($event.target as HTMLInputElement).value)) })"
        />
      </label>

      <button type="button" class="remove" aria-label="Remove class" @click="removeEntry(idx)">×</button>

      <p v-if="prereqWarning(entry)" class="prereq-warn">⚠ {{ prereqWarning(entry) }}</p>
    </div>

    <div class="editor-foot">
      <button type="button" class="ghost-button" :disabled="!canAdd" @click="addEntry">+ Add class</button>
      <span class="total">Total level {{ total }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AbilityScores, ClassEntry } from "~/types/character";
import type { Ability, ClassData, RulesEntity, SubclassData } from "~/types/rules";
import { totalLevel } from "~/utils/multiclass";

const props = defineProps<{
  modelValue: ClassEntry[];
  classes: RulesEntity<ClassData>[];
  subclasses: RulesEntity<SubclassData>[];
  abilityScores?: AbilityScores;
}>();

const emit = defineEmits<{ "update:modelValue": [ClassEntry[]] }>();

const clampLevel = (n: number) =>
  Math.max(1, Math.min(20, Number.isFinite(n) ? Math.floor(n) : 1));

const classOptions = computed(() =>
  props.classes
    .filter((item) => item.data.edition === "classic")
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name) || a.source.localeCompare(b.source))
    .map((c) => ({ id: c.id, name: c.name, source: c.source, sourceType: c.sourceType })),
);

const classById = (id: string) => props.classes.find((c) => c.id === id);

const subclassOptionsFor = (classId: string) => {
  const cls = classById(classId);
  if (!cls) return [];
  return props.subclasses
    .filter((s) =>
      s.data.className === cls.name
      && s.data.classSource === cls.source
      && s.data.subclassFeatures.length > 0,
    )
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name) || a.source.localeCompare(b.source))
    .map((s) => ({ id: s.id, name: s.name, source: s.source }));
};

const total = computed(() => totalLevel(props.modelValue));
const canAdd = computed(() => total.value < 20);

const updateEntry = (idx: number, patch: Partial<ClassEntry>) => {
  emit("update:modelValue", props.modelValue.map((e, i) => (i === idx ? { ...e, ...patch } : e)));
};

const addEntry = () =>
  emit("update:modelValue", [...props.modelValue, { classId: "", subclassId: "", level: 1 }]);

const removeEntry = (idx: number) =>
  emit("update:modelValue", props.modelValue.filter((_, i) => i !== idx));

const PREREQS: Record<string, Partial<Record<Ability, number>>> = {
  Barbarian: { str: 13 }, Bard: { cha: 13 }, Cleric: { wis: 13 }, Druid: { wis: 13 },
  Fighter: { str: 13 }, Monk: { dex: 13, wis: 13 }, Paladin: { str: 13, cha: 13 },
  Ranger: { dex: 13, wis: 13 }, Rogue: { dex: 13 }, Sorcerer: { cha: 13 },
  Warlock: { cha: 13 }, Wizard: { int: 13 }, Artificer: { int: 13 },
};

const prereqWarning = (entry: ClassEntry): string => {
  if (!props.abilityScores) return "";
  const cls = classById(entry.classId);
  if (!cls) return "";
  const req = PREREQS[cls.name];
  if (!req) return "";
  const missing = (Object.entries(req) as [Ability, number][])
    .filter(([ab, min]) => (props.abilityScores![ab] ?? 0) < min)
    .map(([ab, min]) => `${ab.toUpperCase()} ${min}`);
  return missing.length ? `${cls.name} usually requires ${missing.join(", ")}` : "";
};
</script>

<style scoped>
.classes-editor { display: grid; gap: 12px; }

.class-row {
  display: grid;
  grid-template-columns: 1fr 1fr 80px 36px;
  gap: 10px;
  align-items: end;
}
.class-row .prereq-warn { grid-column: 1 / -1; }

.class-row label { display: grid; gap: 4px; }

.remove {
  width: 36px; height: 38px; min-height: auto; padding: 0;
  border: 1px solid var(--rubric-deep);
  border-radius: 4px;
  background: transparent;
  color: var(--rubric);
  font-size: 1.2rem;
  line-height: 1;
}
.remove:hover { background: var(--rubric-deep); color: var(--ink); }

.prereq-warn {
  margin: 2px 0 0;
  font-size: 0.82rem;
  color: var(--gilt);
  font-style: italic;
}

.editor-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.editor-foot .total {
  font-family: "IM Fell English SC", serif;
  letter-spacing: 0.14em;
  font-size: 0.82rem;
  color: var(--ink-soft);
}

@media (max-width: 560px) {
  .class-row { grid-template-columns: 1fr 1fr; }
  .class-row .lvl { grid-column: 1; }
  .class-row .remove { grid-column: 2; justify-self: end; }
}
</style>
