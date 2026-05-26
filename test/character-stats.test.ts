import { describe, it, expect } from "vitest";
import type { CharacterDraft } from "~/types/character";
import type { CustomItem } from "~/types/items";
import { createEmptyCharacter } from "~/utils/character";
import { SKILLS } from "~/utils/skills";
import {
  skillBonus, isSkillProficient, isSkillExpert,
  saveBonus, isSaveProficient, defaultArmorClass, passiveScore, computeAttacks,
} from "~/utils/character-stats";

const base = (): CharacterDraft => ({
  ...createEmptyCharacter(),
  abilityScores: { str: 16, dex: 14, con: 12, int: 10, wis: 8, cha: 18 },
});
const skill = (key: string) => SKILLS.find((s) => s.key === key)!;

describe("skillBonus", () => {
  it("adds proficiency when proficient", () => {
    const c = { ...base(), skillProficiencies: ["athletics"] };
    expect(skillBonus(c, skill("athletics"), 2)).toBe(3 + 2); // STR +3
  });
  it("doubles proficiency when expert", () => {
    const c = { ...base(), skillProficiencies: ["arcana"], skillExpertise: ["arcana"] };
    expect(skillBonus(c, skill("arcana"), 2)).toBe(0 + 4); // INT +0
  });
  it("just the mod when untrained", () => {
    expect(skillBonus(base(), skill("stealth"), 2)).toBe(2); // DEX +2
  });
});

describe("saveBonus", () => {
  it("uses explicit proficiencies when present", () => {
    const c = { ...base(), savingThrowProficiencies: ["con" as const] };
    expect(saveBonus(c, "con", 3)).toBe(1 + 3); // CON +1
    expect(isSaveProficient(c, "str")).toBe(false);
  });
  it("falls back to the primary class saves", () => {
    const primary = { data: { savingThrowProficiencies: ["str", "con"] } } as never;
    expect(isSaveProficient(base(), "str", primary)).toBe(true);
    expect(saveBonus(base(), "str", 2, primary)).toBe(3 + 2);
  });
});

describe("defaultArmorClass & passiveScore", () => {
  it("AC is 10 + dex + equipped ac bonuses", () => {
    const items: CustomItem[] = [{ id: "a", name: "Shield", type: "armor", acBonus: 2, createdAt: "" }];
    const c = { ...base(), inventory: [{ id: "e", itemId: "a", quantity: 1, equipped: true }] };
    expect(defaultArmorClass(c, items)).toBe(10 + 2 + 2);
  });
  it("passive perception is 10 + wis + prof when proficient", () => {
    const c = { ...base(), skillProficiencies: ["perception"] };
    expect(passiveScore(c, "perception", 3)).toBe(10 + -1 + 3); // WIS -1
  });
});

describe("computeAttacks", () => {
  it("includes equipped weapons with ability mod + prof", () => {
    const items: CustomItem[] = [{ id: "w", name: "Longsword", type: "weapon", damage: "1d8", damageType: "slashing", damageAbility: "str", createdAt: "" }];
    const c = { ...base(), weaponProficiencies: ["Martial"], inventory: [{ id: "e", itemId: "w", quantity: 1, equipped: true }] };
    const atks = computeAttacks(c, items, 2);
    expect(atks).toHaveLength(1);
    expect(atks[0]!.name).toBe("Longsword");
    expect(atks[0]!.attackBonus).toBe(3 + 2);
    expect(atks[0]!.damage).toBe("1d8 +3");
  });
  it("ignores unequipped and non-weapons", () => {
    const items: CustomItem[] = [{ id: "w", name: "Dagger", type: "weapon", createdAt: "" }];
    const c = { ...base(), inventory: [{ id: "e", itemId: "w", quantity: 1, equipped: false }] };
    expect(computeAttacks(c, items, 2)).toEqual([]);
  });
});
