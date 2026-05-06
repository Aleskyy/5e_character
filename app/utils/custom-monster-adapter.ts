import type { CustomMonster, MonsterTrait } from "~/types/encounter";

const sizeCode = (s?: string): string[] => {
  if (!s) return ["M"];
  const t = s.trim().toLowerCase();
  if (t.length === 1) return [s.toUpperCase()];
  const map: Record<string, string> = {
    tiny: "T", small: "S", medium: "M", large: "L", huge: "H", gargantuan: "G",
  };
  return [map[t] ?? s];
};

const trait = (list?: MonsterTrait[]) =>
  (list ?? []).filter((t) => t.name || t.description).map((t) => ({
    name: t.name,
    entries: t.description ? [t.description] : [],
  }));

export const customMonsterToSheet = (m: CustomMonster) => {
  const speeds: Record<string, number> = {};
  if (m.speeds) {
    for (const [k, v] of Object.entries(m.speeds)) if (typeof v === "number" && v > 0) speeds[k] = v;
  }
  if (!Object.keys(speeds).length && typeof m.speed === "number" && m.speed > 0) speeds.walk = m.speed;

  const data: Record<string, unknown> = {
    size: sizeCode(m.size),
    type: m.type ?? "",
    ac: m.ac,
    hp: { average: m.hpAvg ?? m.hp ?? null, formula: m.hpFormula ?? null },
    speed: speeds,
    str: m.abilityScores.str, dex: m.abilityScores.dex, con: m.abilityScores.con,
    int: m.abilityScores.int, wis: m.abilityScores.wis, cha: m.abilityScores.cha,
    save: m.saves ?? {},
    skill: m.skillBonuses ?? (m.skills ? { _raw: m.skills } : {}),
    senses: m.sensesList ?? (m.senses ? [m.senses] : []),
    passive: m.passivePerception,
    languages: m.languages ?? [],
    cr: m.cr ?? "",
    immune: m.damageImmune ?? [],
    resist: m.damageResist ?? [],
    vulnerable: m.damageVulnerable ?? [],
    conditionImmune: m.conditionImmune ?? [],
    trait: [
      ...trait(m.traitsList),
      ...(m.traits && !m.traitsList?.length ? [{ name: "Traits", entries: [m.traits] }] : []),
      ...(m.spellcasting ? [{ name: "Spellcasting", entries: [m.spellcasting] }] : []),
    ],
    action: [
      ...trait(m.actionsList),
      ...(m.actions && !m.actionsList?.length ? [{ name: "Actions", entries: [m.actions] }] : []),
    ],
    bonus: trait(m.bonusActions),
    reaction: trait(m.reactions),
    legendary: trait(m.legendaryActions),
    mythic: trait(m.mythicActions),
    lairActions: trait(m.lairActions),
    regionalEffects: trait(m.regionalEffects),
  };

  return {
    id: m.id,
    name: m.name,
    source: m.source ?? "Homebrew",
    data,
  };
};
