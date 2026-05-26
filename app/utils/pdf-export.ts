import { PDFDocument } from "pdf-lib";
import type { CharacterDraft } from "~/types/character";
import { buildFieldValues, type PdfExportContext } from "~/utils/pdf-field-map";

const TEMPLATE_URL = "/template/5E_CharacterSheet_Fillable.pdf";

export const exportCharacterPdf = async (
  character: CharacterDraft,
  ctx: PdfExportContext,
): Promise<Uint8Array> => {
  const res = await fetch(TEMPLATE_URL);
  if (!res.ok) throw new Error(`Could not load PDF template (${res.status})`);
  const bytes = new Uint8Array(await res.arrayBuffer());

  const pdf = await PDFDocument.load(bytes);
  const form = pdf.getForm();
  const { text, checks } = buildFieldValues(character, ctx);

  for (const [name, value] of Object.entries(text)) {
    try {
      form.getTextField(name).setText(value);
    } catch {
      // field absent or wrong type in this template version — skip
    }
  }

  // Shrink the equipment box text so longer item lists stay within the field.
  try {
    form.getTextField("Equipment").setFontSize(6);
  } catch {
    // field absent in this template version — skip
  }
  for (const [name, on] of Object.entries(checks)) {
    try {
      const box = form.getCheckBox(name);
      if (on) box.check(); else box.uncheck();
    } catch {
      // skip missing checkbox
    }
  }

  form.flatten();
  return pdf.save();
};

export const downloadCharacterPdf = async (
  character: CharacterDraft,
  ctx: PdfExportContext,
): Promise<void> => {
  const bytes = await exportCharacterPdf(character, ctx);
  const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${character.name || "character"}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
};
