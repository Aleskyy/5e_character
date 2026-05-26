import { describe, it, expect } from "vitest";
import type { CharacterDraft } from "~/types/character";
import type { ClassData, RaceData, RulesEntity, SpellData, SubclassData } from "~/types/rules";
import { createEmptyCharacter } from "~/utils/character";
import { buildFieldValues, type PdfExportContext } from "~/utils/pdf-field-map";

const cls = (id: string, name: string, extra: Partial<ClassData> = {}): RulesEntity<ClassData> => ({
  id, kind: "class", name, source: "PHB", sourceType: "core",
  data: {
    page: null, edition: "classic", hitDie: { number: 1, faces: 8 },
    savingThrowProficiencies: [], spellcastingAbility: null, casterProgression: null,
    preparedSpellsFormula: null, cantripProgression: [], spellsKnownProgression: [],
    spellsKnownProgressionFixed: [], spellSlotProgression: [], startingProficiencies: {},
    classFeatures: [], multiclassing: null, ...extra,
  },
});

const wizard = cls("c:wiz", "Wizard", {
  spellcastingAbility: "int", casterProgression: "full",
  savingThrowProficiencies: ["int", "wis"],
  spellSlotProgression: [[2], [3], [4, 2]],
});
const fighter = cls("c:fig", "Fighter", { savingThrowProficiencies: ["str", "con"], hitDie: { number: 1, faces: 10 } });

const ctx = (over: Partial<PdfExportContext> = {}): PdfExportContext => ({
  classes: [wizard, fighter], subclasses: [], spells: [], races: [], items: [], ...over,
});

const baseChar = (): CharacterDraft => ({
  ...createEmptyCharacter(),
  name: "Mage",
  abilityScores: { str: 8, dex: 14, con: 12, int: 16, wis: 10, cha: 10 },
  classes: [{ classId: "c:wiz", subclassId: "", level: 3 }],
});

describe("buildFieldValues", () => {
  it("fills identity and class label", () => {
    const { text } = buildFieldValues(baseChar(), ctx());
    expect(text["CharacterName"]).toBe("Mage");
    expect(text["ClassLevel"]).toBe("Wizard 3");
    expect(text["ProfBonus"]).toBe("+2");
  });

  it("joins multiclass label", () => {
    const c = { ...baseChar(), classes: [
      { classId: "c:wiz", subclassId: "", level: 3 },
      { classId: "c:fig", subclassId: "", level: 2 },
    ] };
    expect(buildFieldValues(c, ctx()).text["ClassLevel"]).toBe("Wizard 3 / Fighter 2");
  });

  it("fills ability scores and signed mods", () => {
    const { text } = buildFieldValues(baseChar(), ctx());
    expect(text["INT"]).toBe("16");
    expect(text["INTmod"]).toBe("+3");
    expect(text["STR"]).toBe("8");
    expect(text["STRmod"]).toBe("-1");
  });

  it("checks save proficiency from the primary class and fills totals", () => {
    const { text, checks } = buildFieldValues(baseChar(), ctx());
    expect(checks["Check Box 20"]).toBe(true); // INT save (wizard)
    expect(text["ST Intelligence"]).toBe("+5"); // +3 mod +2 prof
    expect(checks["Check Box 11"]).toBeFalsy(); // STR save not proficient
  });

  it("fills the spellcasting header and slot totals for a caster", () => {
    const { text } = buildFieldValues(baseChar(), ctx());
    expect(text["Spellcasting Class 2"]).toBe("Wizard");
    expect(text["SpellcastingAbility 2"]).toBe("INT");
    expect(text["SpellSaveDC  2"]).toBe("13"); // 8 + 3 + 2
    expect(text["SpellAtkBonus 2"]).toBe("+5");
    expect(text["SlotsTotal 1"] === undefined).toBe(true); // sanity: we key by real names
    expect(text["SlotsTotal 19"]).toBe("4"); // wizard L3 -> [4,2]
    expect(text["SlotsTotal 20"]).toBe("2");
  });

  it("leaves spell header blank for a non-caster", () => {
    const c = { ...baseChar(), classes: [{ classId: "c:fig", subclassId: "", level: 5 }] };
    const { text } = buildFieldValues(c, ctx());
    expect(text["Spellcasting Class 2"]).toBeUndefined();
  });

  it("places known spells into their level rows", () => {
    const fireball: RulesEntity<SpellData> = {
      id: "s:fb", kind: "spell", name: "Fireball", source: "PHB", sourceType: "core",
      data: { page: null, level: 3, school: "V", time: [], range: null, components: {}, duration: [], entries: [], entriesHigherLevel: [], damageInflict: [], savingThrow: [], spellAttack: [], miscTags: [], areaTags: [], classes: [], classVariants: [], subclasses: [] },
    };
    const c = { ...baseChar(), selectedSpellIds: ["s:fb"] };
    const { text } = buildFieldValues(c, ctx({ spells: [fireball] }));
    expect(text["Spells 1048"]).toBe("Fireball"); // first level-3 row
  });
});
