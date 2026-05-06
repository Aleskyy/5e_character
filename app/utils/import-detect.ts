export type ImportKind =
  | "character"
  | "encounter"
  | "customMonster"
  | "customItem"
  | "hbSpell"
  | "hbRace"
  | "hbSubrace"
  | "hbClass"
  | "hbNpc";

export const detectKind = (obj: unknown): ImportKind | null => {
  if (!obj || typeof obj !== "object") return null;
  const o = obj as Record<string, unknown>;

  if (o.kind === "spell") return "hbSpell";
  if (o.kind === "race") return "hbRace";
  if (o.kind === "subrace") return "hbSubrace";
  if (o.kind === "class") return "hbClass";
  if (o.kind === "npc") return "hbNpc";

  if (Array.isArray(o.entries) && typeof o.name === "string" && (o.createdAt || o.updatedAt)) return "encounter";

  if (o.abilityScores && typeof o.classId === "string" && typeof o.level === "number") return "character";

  if (o.abilityScores && (typeof o.ac === "number" || typeof o.hp === "number") && typeof o.name === "string") return "customMonster";

  const itemTypes = ["weapon", "armor", "container", "consumable", "misc"];
  if (typeof o.name === "string" && typeof o.type === "string" && itemTypes.includes(o.type as string)) return "customItem";

  return null;
};

export const KIND_LABEL: Record<ImportKind, string> = {
  character: "Character",
  encounter: "Encounter",
  customMonster: "Custom Monster",
  customItem: "Custom Item",
  hbSpell: "Homebrew Spell",
  hbRace: "Homebrew Race",
  hbSubrace: "Homebrew Subrace",
  hbClass: "Homebrew Class",
  hbNpc: "Homebrew NPC",
};
