import { readFileSync } from "node:fs";
import { PDFDocument } from "pdf-lib";

const buf = readFileSync("./public/template/5E_CharacterSheet_Fillable.pdf");
const pdf = await PDFDocument.load(buf);
const form = pdf.getForm();
const fields = form.getFields();
console.log("total fields:", fields.length);
for (const f of fields) {
  console.log(`${f.constructor.name}\t${JSON.stringify(f.getName())}`);
}
