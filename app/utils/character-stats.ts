import type { CharacterDraft } from "~/types/character";
import type { Ability, ClassData, RulesEntity } from "~/types/rules";
import type { CustomItem } from "~/types/items";
import { abilityModifier } from "~/utils/character";
import { SKILLS, type Skill } from "~/utils/skills";

export const isSkillProficient = (c: CharacterDraft, key: string) =>
  c.skillProficiencies?.includes(key) ?? false;

export const isSkillExpert = (c: CharacterDraft, key: string) =>
  c.skillExpertise?.includes(key) ?? false;

export const skillBonus = (c: CharacterDraft, skill: Skill, profBonus: number) => {
  const mod = abilityModifier(c.abilityScores[skill.ability]);
  if (isSkillExpert(c, skill.key)) return mod + profBonus * 2;
  if (isSkillProficient(c, skill.key)) return mod + profBonus;
  return mod;
};

export const isSaveProficient = (
  c: CharacterDraft,
  ability: Ability,
  primaryClass?: RulesEntity<ClassData>,
) => {
  const explicit = c.savingThrowProficiencies;
  if (explicit && explicit.length) return explicit.includes(ability);
  return primaryClass?.data.savingThrowProficiencies?.includes(ability) ?? false;
};

export const saveBonus = (
  c: CharacterDraft,
  ability: Ability,
  profBonus: number,
  primaryClass?: RulesEntity<ClassData>,
) => abilityModifier(c.abilityScores[ability]) + (isSaveProficient(c, ability, primaryClass) ? profBonus : 0);

export const equippedAcBonus = (c: CharacterDraft, items: CustomItem[]) =>
  (c.inventory ?? [])
    .filter((e) => e.equipped)
    .map((e) => items.find((i) => i.id === e.itemId))
    .reduce((sum, item) => sum + (item?.acBonus ?? 0), 0);

export const defaultArmorClass = (c: CharacterDraft, items: CustomItem[]) =>
  10 + abilityModifier(c.abilityScores.dex) + equippedAcBonus(c, items);

export const passiveScore = (c: CharacterDraft, skillKey: string, profBonus: number) => {
  const skill = SKILLS.find((s) => s.key === skillKey)!;
  const mod = abilityModifier(c.abilityScores[skill.ability]);
  const isExp = c.skillExpertise?.includes(skillKey) ?? false;
  const isProf = c.skillProficiencies?.includes(skillKey) ?? false;
  return 10 + mod + (isExp ? profBonus * 2 : isProf ? profBonus : 0);
};

export type Attack = { id: string; name: string; attackBonus: number; damage: string; damageType: string };

export const computeAttacks = (c: CharacterDraft, items: CustomItem[], profBonus: number): Attack[] =>
  (c.inventory ?? [])
    .filter((e) => e.equipped)
    .map((e) => items.find((i) => i.id === e.itemId))
    .filter((it): it is CustomItem => !!it && it.type === "weapon")
    .map((it, idx) => {
      const ability = it.damageAbility ?? "str";
      const mod = abilityModifier(c.abilityScores[ability]);
      const isProf = (c.weaponProficiencies?.length ?? 0) > 0;
      const bonus = mod + (isProf ? profBonus : 0);
      const dmgBonus = mod >= 0 ? `+${mod}` : String(mod);
      return {
        id: `${it.id}-${idx}`,
        name: it.name,
        attackBonus: bonus,
        damage: it.damage ? `${it.damage}${mod !== 0 ? ` ${dmgBonus}` : ""}` : dmgBonus,
        damageType: it.damageType ?? "",
      };
    });
