import type { RulesEntity, SpellData, SubclassData } from "~/types/rules";

export const spellKey = (spell: RulesEntity<SpellData>) =>
  `${spell.name.toLowerCase()}|${spell.source.toLowerCase()}`;

const parseAdditionalSpell = (value: unknown) => {
  if (typeof value !== "string") return null;
  const [name, source] = value.split("|");
  return {
    name: name.split("#")[0]?.trim().toLowerCase() ?? "",
    source: (source ?? "PHB").split("#")[0]?.trim().toLowerCase(),
  };
};

const collectAdditionalSpellRefs = (
  value: unknown,
  refs: { name: string; source: string }[],
) => {
  const parsed = parseAdditionalSpell(value);
  if (parsed?.name) refs.push(parsed);
  if (Array.isArray(value)) { for (const item of value) collectAdditionalSpellRefs(item, refs); return; }
  if (value && typeof value === "object") {
    for (const item of Object.values(value)) collectAdditionalSpellRefs(item, refs);
  }
};

export const subclassAdditionalSpellKeys = (
  subclass: RulesEntity<SubclassData> | undefined,
  spells: RulesEntity<SpellData>[],
): Set<string> => {
  const refs: { name: string; source: string }[] = [];
  const additionalSpells = subclass?.data.additionalSpells ?? [];
  collectAdditionalSpellRefs(additionalSpells, refs);
  return new Set(
    refs.map((ref) => {
      const exact = spells.find(
        (s) => s.name.toLowerCase() === ref.name && s.source.toLowerCase() === ref.source,
      );
      const fallback = spells.find((s) => s.name.toLowerCase() === ref.name);
      return exact ? spellKey(exact) : fallback ? spellKey(fallback) : "";
    }).filter(Boolean),
  );
};

export const spellMatchesClass = (
  spell: RulesEntity<SpellData>,
  className: string | undefined,
  classSource: string | undefined,
  subclass: RulesEntity<SubclassData> | undefined,
  additionalKeys: Set<string>,
): boolean => {
  if (!className) return false;

  const matchesClass = [...spell.data.classes, ...spell.data.classVariants].some(
    (sc) => sc.name === className && sc.source === classSource,
  );
  if (matchesClass) return true;

  if (subclass) {
    const matchesSubclass = spell.data.subclasses.some((ss) => {
      const subName = ss.subclassShortName ?? ss.name;
      const subSource = ss.subclassSource ?? ss.source;
      return (
        subName === subclass.data.shortName
        && subSource === subclass.source
        && (!ss.className || ss.className === className)
        && (!ss.classSource || ss.classSource === classSource)
      );
    });
    if (matchesSubclass) return true;
  }

  return additionalKeys.has(spellKey(spell));
};
