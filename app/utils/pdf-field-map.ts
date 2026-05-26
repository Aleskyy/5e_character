import type { CharacterDraft } from "~/types/character";
import type { Ability, ClassData, RaceData, RulesEntity, SpellData, SubclassData } from "~/types/rules";
import type { CustomItem } from "~/types/items";
import { abilityModifier, proficiencyBonus, signed } from "~/utils/character";
import { totalLevel, effectiveSpellSlots, pactSlots, hitDiceLabel, type ClassLookup } from "~/utils/multiclass";
import { SKILLS } from "~/utils/skills";
import { skillBonus, saveBonus, isSaveProficient, isSkillProficient, isSkillExpert, defaultArmorClass, passiveScore, computeAttacks } from "~/utils/character-stats";
import {
  SCALAR, ABILITY_SCORE_FIELD, ABILITY_MOD_FIELD, SAVE_FIELD, SAVE_CHECKBOX,
  SKILL_FIELD, SKILL_CHECKBOX, WEAPON_ROWS, SLOT_FIELDS_BY_LEVEL, SPELL_ROWS_BY_LEVEL,
} from "~/utils/pdf-field-names";

export type PdfExportContext = {
  classes: RulesEntity<ClassData>[];
  subclasses: RulesEntity<SubclassData>[];
  spells: RulesEntity<SpellData>[];
  races: RulesEntity<RaceData>[];
  items: CustomItem[];
  /** Names of all available race + class + subclass features, for the Features & Traits box. */
  featureNames?: string[];
  /** Names of feats the character has taken, for the page-2 Feat+Traits box. */
  featNames?: string[];
};

export type PdfFieldValues = { text: Record<string, string>; checks: Record<string, boolean> };

const ABILITIES: Ability[] = ["str", "dex", "con", "int", "wis", "cha"];

export const buildFieldValues = (c: CharacterDraft, ctx: PdfExportContext): PdfFieldValues => {
  const text: Record<string, string> = {};
  const checks: Record<string, boolean> = {};
  const setT = (name: string, value: string | number | undefined | null) => {
    if (value === undefined || value === null) return;
    const s = `${value}`;
    if (s !== "") text[name] = s;
  };

  const entries = c.classes ?? [];
  const resolved = entries.map((e) => ({
    e,
    cls: ctx.classes.find((k) => k.id === e.classId),
    sub: ctx.subclasses.find((s) => s.id === e.subclassId),
  }));
  const lookup: ClassLookup = (id) => ctx.classes.find((k) => k.id === id);
  const lvl = entries.length ? totalLevel(entries) : (c.level ?? 1);
  const prof = proficiencyBonus(lvl);
  const primaryClass = resolved[0]?.cls;

  // --- Identity ---
  setT(SCALAR.characterName, c.name);
  setT(SCALAR.characterName2, c.name);
  setT(SCALAR.classLevel, resolved.map((r) => `${r.cls?.name ?? ""} ${r.e.level}`.trim()).filter(Boolean).join(" / "));
  setT(SCALAR.race, ctx.races.find((r) => r.id === c.raceId)?.name ?? "");
  setT(SCALAR.background, c.background?.name ?? "");
  setT(SCALAR.alignment, c.background?.alignment ?? "");
  setT(SCALAR.xp, c.background?.experience ?? "");
  setT(SCALAR.profBonus, signed(prof));

  // --- Abilities, saves ---
  for (const ab of ABILITIES) {
    setT(ABILITY_SCORE_FIELD[ab], c.abilityScores[ab]);
    setT(ABILITY_MOD_FIELD[ab], signed(abilityModifier(c.abilityScores[ab])));
    setT(SAVE_FIELD[ab], signed(saveBonus(c, ab, prof, primaryClass)));
    if (isSaveProficient(c, ab, primaryClass)) checks[SAVE_CHECKBOX[ab]] = true;
  }

  // --- Skills ---
  for (const skill of SKILLS) {
    setT(SKILL_FIELD[skill.key], signed(skillBonus(c, skill, prof)));
    if (isSkillProficient(c, skill.key) || isSkillExpert(c, skill.key)) {
      checks[SKILL_CHECKBOX[skill.key]] = true;
    }
  }
  setT(SCALAR.passive, passiveScore(c, "perception", prof));

  // --- Combat ---
  setT(SCALAR.ac, c.armorClass ?? defaultArmorClass(c, ctx.items));
  setT(SCALAR.initiative, signed(c.initiativeBonus ?? abilityModifier(c.abilityScores.dex)));
  setT(SCALAR.speed, c.speed ?? "");
  setT(SCALAR.hpMax, c.maxHp);
  setT(SCALAR.hpCurrent, c.currentHp);
  setT(SCALAR.hpTemp, c.temporaryHp || "");
  setT(SCALAR.hdTotal, hitDiceLabel(entries, lookup));
  if (c.inspiration) text["Inspiration"] = "Yes";

  // --- Attacks ---
  const attacks = computeAttacks(c, ctx.items, prof);
  WEAPON_ROWS.forEach((row, i) => {
    const a = attacks[i];
    if (!a) return;
    setT(row.name, a.name);
    setT(row.atk, signed(a.attackBonus));
    setT(row.damage, `${a.damage}${a.damageType ? ` ${a.damageType}` : ""}`);
  });

  // --- Proficiencies & languages, equipment, features ---
  const profLines = [
    ...(c.languages ?? []),
    ...(c.toolProficiencies ?? []),
    ...(c.weaponProficiencies ?? []),
    ...(c.armorProficiencies ?? []),
    ...(c.weaponMasteries ?? []),
  ];
  setT(SCALAR.proficienciesLang, profLines.join(", "));

  const equipment = (c.inventory ?? [])
    .map((e) => ctx.items.find((i) => i.id === e.itemId))
    .filter((it): it is CustomItem => !!it)
    .map((it) => it.name)
    .join(", ");
  setT(SCALAR.equipment, equipment);

  setT(SCALAR.featuresTraits, (ctx.featureNames ?? []).join("\n"));

  // --- Currency ---
  setT(SCALAR.cp, c.currency.cp || "");
  setT(SCALAR.sp, c.currency.sp || "");
  setT(SCALAR.gp, c.currency.gp || "");
  setT(SCALAR.pp, c.currency.pp || "");

  // --- Page 2 ---
  setT(SCALAR.personality, c.background?.personalityTraits ?? "");
  setT(SCALAR.ideals, c.background?.ideals ?? "");
  setT(SCALAR.bonds, c.background?.bonds ?? "");
  setT(SCALAR.flaws, c.background?.flaws ?? "");
  const backstory = [c.background?.appearance, c.background?.backstory].filter(Boolean).join("\n\n");
  setT(SCALAR.backstory, backstory);
  const allies = (c.relations ?? []).map((r) => [r.name, r.race, r.status].filter(Boolean).join(" — ")).join("\n");
  setT(SCALAR.allies, allies);
  setT(SCALAR.featTraits2, (ctx.featNames ?? []).join("\n"));

  // --- Page 3 spellcasting ---
  const primaryCaster = resolved.find((r) => r.cls?.data.spellcastingAbility);
  if (primaryCaster?.cls) {
    const ability = primaryCaster.cls.data.spellcastingAbility as Ability;
    const mod = abilityModifier(c.abilityScores[ability]);
    const attack = mod + prof;
    setT(SCALAR.spellClass, primaryCaster.cls.name);
    setT(SCALAR.spellAbility, ability.toUpperCase());
    setT(SCALAR.spellSaveDc, 8 + attack);
    setT(SCALAR.spellAtkBonus, signed(attack));

    // slot totals (fold pact slots into their level)
    const slots = effectiveSpellSlots(entries, lookup);
    const pact = pactSlots(entries, lookup);
    for (let level = 1; level <= 9; level++) {
      let total = slots[level - 1] ?? 0;
      if (pact && pact.level === level) total += pact.count;
      const fields = SLOT_FIELDS_BY_LEVEL[level];
      if (!fields || total <= 0) continue;
      setT(fields.total, total);
      const used = c.usedSpellSlots?.[level - 1] ?? 0;
      setT(fields.remaining, Math.max(0, total - used));
    }

    // known spells into level rows (truncate at row limits)
    const known = ctx.spells
      .filter((s) => c.selectedSpellIds.includes(s.id))
      .sort((a, b) => a.data.level - b.data.level || a.name.localeCompare(b.name));
    const byLevel = new Map<number, RulesEntity<SpellData>[]>();
    for (const s of known) {
      const l = s.data.level;
      if (!byLevel.has(l)) byLevel.set(l, []);
      byLevel.get(l)!.push(s);
    }
    for (const [level, list] of byLevel) {
      const rows = SPELL_ROWS_BY_LEVEL[level];
      if (!rows) continue;
      list.slice(0, rows.length).forEach((s, i) => setT(rows[i]!, s.name));
    }
  }

  return { text, checks };
};
