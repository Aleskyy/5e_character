import { readFileSync } from "node:fs";
import { PDFDocument } from "pdf-lib";

const buf = readFileSync("./public/template/5E_CharacterSheet_Fillable.pdf");
const pdf = await PDFDocument.load(buf);
const pageRefs = pdf.getPages().map((p) => p.ref);
const form = pdf.getForm();

const widgets = [];
for (const field of form.getFields()) {
  const name = field.getName();
  const kind = field.constructor.name;
  for (const w of field.acroField.getWidgets()) {
    const r = w.getRectangle();
    let page = -1;
    try { page = pageRefs.findIndex((ref) => ref === w.P()); } catch { /* ignore */ }
    widgets.push({ name, kind, page, x: Math.round(r.x), y: Math.round(r.y) });
  }
}
const onPage = (n) => widgets.filter((w) => w.page === n);

// ---- Page 3 grouping ----
const p3 = onPage(2);
const col = (x) => (x < 180 ? 0 : x < 380 ? 1 : 2);

const slots = p3
  .filter((w) => w.name.startsWith("SlotsTotal"))
  .map((w) => ({ ...w, c: col(w.x) }));
const remaining = p3.filter((w) => w.name.startsWith("SlotsRemaining")).map((w) => ({ ...w, c: col(w.x) }));
const spells = p3.filter((w) => w.name.startsWith("Spells ")).map((w) => ({ ...w, c: col(w.x) }));

// Ordered level blocks: per column top→bottom, columns left→mid→right
const slotOrder = [0, 1, 2].flatMap((c) =>
  slots.filter((s) => s.c === c).sort((a, b) => b.y - a.y),
);
// slotOrder[i] => spell level i+1
const SLOT_FIELDS_BY_LEVEL = {};
slotOrder.forEach((s, i) => {
  const rem = remaining
    .filter((r) => r.c === s.c && Math.abs(r.y - s.y) <= 4)
    .sort((a, b) => Math.abs(a.y - s.y) - Math.abs(b.y - s.y))[0];
  SLOT_FIELDS_BY_LEVEL[i + 1] = { total: s.name, remaining: rem?.name ?? null };
});

// Assign each spell row to the nearest slot header ABOVE it in the same column.
// Cantrips = left column rows above the topmost left-column slot header.
const leftTopSlotY = Math.max(...slots.filter((s) => s.c === 0).map((s) => s.y));
const levelOfSlot = new Map(slotOrder.map((s, i) => [s.name, i + 1]));

const SPELL_ROWS_BY_LEVEL = {};
for (let l = 0; l <= 9; l++) SPELL_ROWS_BY_LEVEL[l] = [];

for (const sp of spells) {
  if (sp.c === 0 && sp.y > leftTopSlotY) {
    SPELL_ROWS_BY_LEVEL[0].push(sp); // cantrip
    continue;
  }
  const header = slots
    .filter((s) => s.c === sp.c && s.y >= sp.y - 2)
    .sort((a, b) => a.y - b.y)[0]; // nearest header at or above
  if (!header) { SPELL_ROWS_BY_LEVEL[0].push(sp); continue; }
  const lvl = levelOfSlot.get(header.name);
  SPELL_ROWS_BY_LEVEL[lvl].push(sp);
}

// sort rows within each level top→bottom and reduce to names
for (let l = 0; l <= 9; l++) {
  SPELL_ROWS_BY_LEVEL[l] = SPELL_ROWS_BY_LEVEL[l].sort((a, b) => b.y - a.y).map((w) => w.name);
}

console.log("export const SLOT_FIELDS_BY_LEVEL =", JSON.stringify(SLOT_FIELDS_BY_LEVEL, null, 2), "as const;");
console.log("\nexport const SPELL_ROWS_BY_LEVEL =", JSON.stringify(SPELL_ROWS_BY_LEVEL, null, 2), "as const;");
console.log("\n// row counts per level:", Object.fromEntries(Object.entries(SPELL_ROWS_BY_LEVEL).map(([k, v]) => [k, v.length])));
