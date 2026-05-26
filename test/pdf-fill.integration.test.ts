import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { PDFDocument } from "pdf-lib";
import type { CharacterDraft } from "~/types/character";
import type { ClassData, RaceData, RulesEntity, SpellData, SubclassData } from "~/types/rules";
import { createEmptyCharacter } from "~/utils/character";
import { buildFieldValues, type PdfExportContext } from "~/utils/pdf-field-map";

// Verifies the REAL binary fill path: every value buildFieldValues produces can be
// written into the actual template without pdf-lib throwing (catches name/type mismatches).

const wizard: RulesEntity<ClassData> = {
  id: "c:wiz", kind: "class", name: "Wizard", source: "PHB", sourceType: "core",
  data: {
    page: null, edition: "classic", hitDie: { number: 1, faces: 6 },
    savingThrowProficiencies: ["int", "wis"], spellcastingAbility: "int", casterProgression: "full",
    preparedSpellsFormula: null, cantripProgression: [], spellsKnownProgression: [],
    spellsKnownProgressionFixed: [], spellSlotProgression: [[2], [3], [4, 2]],
    startingProficiencies: {}, classFeatures: [], multiclassing: null,
  },
};
const cleric: RulesEntity<ClassData> = {
  ...wizard, id: "c:cle", name: "Cleric",
  data: { ...wizard.data, spellcastingAbility: "wis", savingThrowProficiencies: ["wis", "cha"] },
};
const fireball: RulesEntity<SpellData> = {
  id: "s:fb", kind: "spell", name: "Fireball", source: "PHB", sourceType: "core",
  data: { page: null, level: 3, school: "V", time: [], range: null, components: {}, duration: [], entries: [], entriesHigherLevel: [], damageInflict: [], savingThrow: [], spellAttack: [], miscTags: [], areaTags: [], classes: [], classVariants: [], subclasses: [] },
};

const ctx: PdfExportContext = {
  classes: [wizard, cleric], subclasses: [], spells: [fireball], races: [], items: [],
};

const character: CharacterDraft = {
  ...createEmptyCharacter(),
  name: "Smoke Test",
  abilityScores: { str: 8, dex: 14, con: 12, int: 16, wis: 13, cha: 10 },
  classes: [
    { classId: "c:wiz", subclassId: "", level: 3 },
    { classId: "c:cle", subclassId: "", level: 2 },
  ],
  skillProficiencies: ["arcana", "perception"],
  savingThrowProficiencies: ["int", "wis"],
  selectedSpellIds: ["s:fb"],
};

describe("PDF binary fill (integration)", () => {
  it("fills the real template without throwing and produces a non-trivial PDF", async () => {
    const buf = readFileSync("./public/template/5E_CharacterSheet_Fillable.pdf");
    const pdf = await PDFDocument.load(buf);
    const form = pdf.getForm();
    const { text, checks } = buildFieldValues(character, ctx);

    // every produced field name must resolve to the correct widget type
    for (const [name, value] of Object.entries(text)) {
      form.getTextField(name).setText(value);
    }
    for (const [name, on] of Object.entries(checks)) {
      const box = form.getCheckBox(name);
      if (on) box.check(); else box.uncheck();
    }
    form.flatten();
    const out = await pdf.save();
    expect(out.length).toBeGreaterThan(10000);
    // sanity: we actually mapped meaningful values
    expect(text["ClassLevel"]).toBe("Wizard 3 / Cleric 2");
    expect(text["Spells 1048"]).toBe("Fireball");
  });
});
