import type { ClassData, RaceData, RulesEntity, SpellData } from "~/types/rules";

type RulesData = {
  classes: RulesEntity<ClassData>[];
  races: RulesEntity<RaceData>[];
  spells: RulesEntity<SpellData>[];
  sources: string[];
};

const fetchRulesFile = async <T>(fileName: string) =>
  await $fetch<T>(`/data/${fileName}`);

export const useRulesData = async () => {
  const [classes, races, spells, sources] = await Promise.all([
    fetchRulesFile<RulesEntity<ClassData>[]>("classes.json"),
    fetchRulesFile<RulesEntity<RaceData>[]>("races.json"),
    fetchRulesFile<RulesEntity<SpellData>[]>("spells.json"),
    fetchRulesFile<string[]>("sources.json"),
  ]);

  return {
    classes,
    races,
    spells,
    sources,
  } satisfies RulesData;
};
