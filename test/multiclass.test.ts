import { describe, it, expect } from "vitest";
import type { ClassData, RulesEntity } from "~/types/rules";
import type { ClassEntry } from "~/types/character";
import {
  totalLevel,
  casterLevel,
  multiclassSpellSlots,
  effectiveSpellSlots,
  pactSlots,
  type ClassLookup,
} from "~/utils/multiclass";

const makeClass = (
  id: string,
  casterProgression: ClassData["casterProgression"],
  spellSlotProgression: number[][] = [],
): RulesEntity<ClassData> => ({
  id,
  kind: "class",
  name: id,
  source: "TEST",
  sourceType: "core",
  data: {
    page: null, edition: "classic", hitDie: { number: 1, faces: 8 },
    savingThrowProficiencies: [], spellcastingAbility: null,
    casterProgression, preparedSpellsFormula: null,
    cantripProgression: [], spellsKnownProgression: [],
    spellsKnownProgressionFixed: [], spellSlotProgression,
    startingProficiencies: {}, classFeatures: [], multiclassing: null,
  },
});

const wizard = makeClass("wizard", "full", [[2], [3], [4, 2]]);
const cleric = makeClass("cleric", "full");
const paladin = makeClass("paladin", "1/2");
const artificer = makeClass("artificer", "artificer");
const warlock = makeClass("warlock", "pact");
const fighter = makeClass("fighter", null);

const lookupFrom = (...cs: RulesEntity<ClassData>[]): ClassLookup => {
  const map = new Map(cs.map((c) => [c.id, c]));
  return (id: string) => map.get(id);
};

const entry = (classId: string, level: number): ClassEntry => ({ classId, subclassId: "", level });

describe("totalLevel", () => {
  it("sums entry levels", () => {
    expect(totalLevel([entry("wizard", 3), entry("cleric", 2)])).toBe(5);
  });
  it("is 0 for empty", () => {
    expect(totalLevel([])).toBe(0);
  });
});

describe("casterLevel", () => {
  const lookup = lookupFrom(wizard, cleric, paladin, artificer, warlock, fighter);
  it("adds full casters at full level", () => {
    expect(casterLevel([entry("wizard", 3), entry("cleric", 2)], lookup)).toBe(5);
  });
  it("adds half casters rounded down", () => {
    expect(casterLevel([entry("paladin", 5)], lookup)).toBe(2);
  });
  it("adds artificer rounded up", () => {
    expect(casterLevel([entry("artificer", 5)], lookup)).toBe(3);
  });
  it("excludes warlock and non-casters", () => {
    expect(casterLevel([entry("warlock", 5), entry("fighter", 4)], lookup)).toBe(0);
  });
});

describe("multiclassSpellSlots", () => {
  it("returns the level-5 row padded to 9", () => {
    expect(multiclassSpellSlots(5)).toEqual([4, 3, 2, 0, 0, 0, 0, 0, 0]);
  });
  it("returns empty below 1", () => {
    expect(multiclassSpellSlots(0)).toEqual([]);
  });
  it("clamps above 20", () => {
    expect(multiclassSpellSlots(99)).toEqual(multiclassSpellSlots(20));
  });
});

describe("effectiveSpellSlots", () => {
  it("uses the single class native progression for one caster", () => {
    const lookup = lookupFrom(wizard, fighter);
    expect(effectiveSpellSlots([entry("wizard", 3), entry("fighter", 2)], lookup)).toEqual([4, 2]);
  });
  it("uses the multiclass table for two casters", () => {
    const lookup = lookupFrom(wizard, cleric);
    expect(effectiveSpellSlots([entry("wizard", 3), entry("cleric", 2)], lookup)).toEqual(
      multiclassSpellSlots(5),
    );
  });
  it("returns empty with no casters", () => {
    const lookup = lookupFrom(fighter);
    expect(effectiveSpellSlots([entry("fighter", 5)], lookup)).toEqual([]);
  });
});

describe("pactSlots", () => {
  const lookup = lookupFrom(warlock, wizard);
  it("returns warlock pact slots by level", () => {
    expect(pactSlots([entry("warlock", 5), entry("wizard", 2)], lookup)).toEqual({ count: 2, level: 3 });
  });
  it("returns null without a warlock", () => {
    expect(pactSlots([entry("wizard", 5)], lookup)).toBeNull();
  });
});
