import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { PDFDocument } from "pdf-lib";
import {
  SCALAR, ABILITY_SCORE_FIELD, ABILITY_MOD_FIELD, SAVE_FIELD, SAVE_CHECKBOX,
  SKILL_FIELD, SKILL_CHECKBOX, WEAPON_ROWS, SLOT_FIELDS_BY_LEVEL, SPELL_ROWS_BY_LEVEL,
} from "~/utils/pdf-field-names";

let names: Set<string>;

beforeAll(async () => {
  const buf = readFileSync("./public/template/5E_CharacterSheet_Fillable.pdf");
  const pdf = await PDFDocument.load(buf);
  names = new Set(pdf.getForm().getFields().map((f) => f.getName()));
});

const all = () => [
  ...Object.values(SCALAR),
  ...Object.values(ABILITY_SCORE_FIELD), ...Object.values(ABILITY_MOD_FIELD),
  ...Object.values(SAVE_FIELD), ...Object.values(SAVE_CHECKBOX),
  ...Object.values(SKILL_FIELD), ...Object.values(SKILL_CHECKBOX),
  ...WEAPON_ROWS.flatMap((w) => [w.name, w.atk, w.damage]),
  ...Object.values(SLOT_FIELDS_BY_LEVEL).flatMap((s) => [s.total, s.remaining]),
  ...Object.values(SPELL_ROWS_BY_LEVEL).flat(),
];

describe("pdf-field-names", () => {
  it("every mapped field name exists in the template PDF", () => {
    const missing = all().filter((n) => !names.has(n));
    expect(missing).toEqual([]);
  });
});
