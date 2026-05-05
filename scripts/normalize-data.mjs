import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const SOURCE_DIR = path.join(ROOT, "5etools-v2.28.0", "data");
const OUT_DIR = path.join(ROOT, "public", "data");

const slugify = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const sourceSlug = (source) => slugify(source || "unknown");

const entityId = (kind, source, name, extra = []) =>
  [kind, sourceSlug(source), slugify(name), ...extra.map(slugify).filter(Boolean)].join(":");

const readJson = async (...parts) => {
  const filePath = path.join(SOURCE_DIR, ...parts);
  return JSON.parse(await readFile(filePath, "utf8"));
};

const writeJson = async (fileName, data) => {
  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(path.join(OUT_DIR, fileName), `${JSON.stringify(data, null, 2)}\n`);
};

const normalizeEntries = (entries = []) => entries;

const normalizeClass = (rawClass) => {
  const spellSlotTable = rawClass.classTableGroups?.find((group) =>
    String(group.title || "").toLowerCase().includes("spell slots"),
  );

  return {
    id: entityId("class", rawClass.source, rawClass.name),
    kind: "class",
    name: rawClass.name,
    source: rawClass.source,
    sourceType: "core",
    data: {
      page: rawClass.page ?? null,
      edition: rawClass.edition ?? "classic",
      hitDie: rawClass.hd ?? null,
      savingThrowProficiencies: rawClass.proficiency ?? [],
      spellcastingAbility: rawClass.spellcastingAbility ?? null,
      casterProgression: rawClass.casterProgression ?? null,
      preparedSpellsFormula: rawClass.preparedSpells ?? null,
      cantripProgression: rawClass.cantripProgression ?? [],
      spellsKnownProgression: rawClass.spellsKnownProgression ?? [],
      spellsKnownProgressionFixed: rawClass.spellsKnownProgressionFixed ?? [],
      spellSlotProgression: spellSlotTable?.rows ?? [],
      startingProficiencies: rawClass.startingProficiencies ?? {},
      classFeatures: rawClass.classFeatures ?? [],
      multiclassing: rawClass.multiclassing ?? null,
    },
  };
};

const normalizeSubclass = (rawSubclass) => ({
  id: entityId("subclass", rawSubclass.source, rawSubclass.name, [
    rawSubclass.className,
    rawSubclass.classSource,
  ]),
  kind: "subclass",
  name: rawSubclass.name,
  source: rawSubclass.source,
  sourceType: "core",
  data: {
    shortName: rawSubclass.shortName ?? rawSubclass.name,
    className: rawSubclass.className,
    classSource: rawSubclass.classSource,
    page: rawSubclass.page ?? null,
    subclassFeatures: rawSubclass.subclassFeatures ?? [],
    additionalSpells: rawSubclass.additionalSpells ?? [],
  },
});

const normalizeClassFeature = (feature) => ({
  id: entityId("classFeature", feature.source, feature.name, [
    feature.className,
    feature.classSource,
    String(feature.level ?? ""),
  ]),
  kind: "classFeature",
  name: feature.name,
  source: feature.source,
  sourceType: "core",
  data: {
    className: feature.className,
    classSource: feature.classSource,
    level: feature.level ?? null,
    page: feature.page ?? null,
    entries: normalizeEntries(feature.entries),
  },
});

const normalizeSubclassFeature = (feature) => ({
  id: entityId("subclassFeature", feature.source, feature.name, [
    feature.className,
    feature.classSource,
    feature.subclassShortName,
    feature.subclassSource,
    String(feature.level ?? ""),
  ]),
  kind: "subclassFeature",
  name: feature.name,
  source: feature.source,
  sourceType: "core",
  data: {
    className: feature.className,
    classSource: feature.classSource,
    subclassShortName: feature.subclassShortName,
    subclassSource: feature.subclassSource,
    level: feature.level ?? null,
    page: feature.page ?? null,
    entries: normalizeEntries(feature.entries),
  },
});

const normalizeRace = (race) => ({
  id: entityId("race", race.source, race.name),
  kind: "race",
  name: race.name,
  source: race.source,
  sourceType: "core",
  data: {
    page: race.page ?? null,
    size: race.size ?? [],
    speed: race.speed ?? null,
    ability: race.ability ?? [],
    languageProficiencies: race.languageProficiencies ?? [],
    skillProficiencies: race.skillProficiencies ?? [],
    traitTags: race.traitTags ?? [],
    entries: normalizeEntries(race.entries),
  },
});

const normalizeSpell = (spell, spellSources) => ({
  id: entityId("spell", spell.source, spell.name),
  kind: "spell",
  name: spell.name,
  source: spell.source,
  sourceType: "core",
  data: {
    page: spell.page ?? null,
    level: spell.level,
    school: spell.school,
    time: spell.time ?? [],
    range: spell.range ?? null,
    components: spell.components ?? {},
    duration: spell.duration ?? [],
    entries: normalizeEntries(spell.entries),
    entriesHigherLevel: normalizeEntries(spell.entriesHigherLevel),
    damageInflict: spell.damageInflict ?? [],
    savingThrow: spell.savingThrow ?? [],
    spellAttack: spell.spellAttack ?? [],
    miscTags: spell.miscTags ?? [],
    areaTags: spell.areaTags ?? [],
    classes: spellSources?.class ?? spell.classes?.fromClassList ?? [],
    classVariants: spellSources?.classVariant ?? spell.classes?.fromClassListVariant ?? [],
    subclasses: spellSources?.subclass ?? spell.classes?.fromSubclass ?? [],
  },
});

const main = async () => {
  const classIndex = await readJson("class", "index.json");
  const classFiles = await Promise.all(
    Object.values(classIndex).map((fileName) => readJson("class", fileName)),
  );

  const classes = [];
  const subclasses = [];
  const classFeatures = [];
  const subclassFeatures = [];

  for (const file of classFiles) {
    classes.push(...(file.class ?? []).map(normalizeClass));
    subclasses.push(...(file.subclass ?? []).map(normalizeSubclass));
    classFeatures.push(...(file.classFeature ?? []).map(normalizeClassFeature));
    subclassFeatures.push(...(file.subclassFeature ?? []).map(normalizeSubclassFeature));
  }

  const raceFile = await readJson("races.json");
  const races = (raceFile.race ?? [])
    .filter((race) => !race._copy)
    .map(normalizeRace);

  const spellIndex = await readJson("spells", "index.json");
  const spellSources = await readJson("spells", "sources.json");
  const spellFiles = await Promise.all(
    Object.values(spellIndex).map((fileName) => readJson("spells", fileName)),
  );
  const spells = spellFiles
    .flatMap((file) => file.spell ?? [])
    .map((spell) => normalizeSpell(spell, spellSources[spell.source]?.[spell.name]));

  const sources = [...new Set([
    ...classes.map((it) => it.source),
    ...subclasses.map((it) => it.source),
    ...races.map((it) => it.source),
    ...spells.map((it) => it.source),
  ])].sort();

  await writeJson("classes.json", classes);
  await writeJson("subclasses.json", subclasses);
  await writeJson("classFeatures.json", classFeatures);
  await writeJson("subclassFeatures.json", subclassFeatures);
  await writeJson("races.json", races);
  await writeJson("spells.json", spells);
  await writeJson("sources.json", sources);

  console.log(`Normalized ${classes.length} classes`);
  console.log(`Normalized ${subclasses.length} subclasses`);
  console.log(`Normalized ${classFeatures.length} class features`);
  console.log(`Normalized ${subclassFeatures.length} subclass features`);
  console.log(`Normalized ${races.length} races`);
  console.log(`Normalized ${spells.length} spells`);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
