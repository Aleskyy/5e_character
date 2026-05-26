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

const classifySource = (source) => {
  const s = String(source || "");
  if (s.startsWith("UA")) return "ua";
  if (["DMG", "PHB", "XPHB", "MM", "TCE", "XGE", "FTD", "VRGR", "BGG", "EGW", "SCAG", "DSotDQ", "FRHoF"].includes(s)) return "core";
  return "supplement";
};

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
    sourceType: classifySource(rawClass.source),
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
      spellSlotProgression: spellSlotTable?.rowsSpellProgression ?? spellSlotTable?.rows ?? [],
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
  sourceType: classifySource(rawSubclass.source),
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
  sourceType: classifySource(feature.source),
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
  sourceType: classifySource(feature.source),
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

const normalizeMonster = (m) => {
  const acVal = Array.isArray(m.ac) ? (typeof m.ac[0] === "number" ? m.ac[0] : m.ac[0]?.ac ?? null) : (m.ac ?? null);
  const hpAvg = m.hp?.average ?? null;
  const hpFormula = m.hp?.formula ?? null;
  const typeStr = typeof m.type === "string" ? m.type : (m.type?.type ?? "");
  return {
    id: entityId("monster", m.source, m.name),
    kind: "monster",
    name: m.name,
    source: m.source,
    sourceType: classifySource(m.source),
    data: {
      page: m.page ?? null,
      size: m.size ?? [],
      type: typeStr,
      ac: acVal,
      hp: { average: hpAvg, formula: hpFormula },
      speed: m.speed ?? {},
      str: m.str ?? 10, dex: m.dex ?? 10, con: m.con ?? 10,
      int: m.int ?? 10, wis: m.wis ?? 10, cha: m.cha ?? 10,
      save: m.save ?? {},
      skill: m.skill ?? {},
      senses: m.senses ?? [],
      passive: m.passive ?? null,
      languages: m.languages ?? [],
      cr: m.cr ?? null,
      trait: normalizeEntries(m.trait ?? []),
      action: normalizeEntries(m.action ?? []),
      reaction: normalizeEntries(m.reaction ?? []),
      legendary: normalizeEntries(m.legendary ?? []),
    },
  };
};

const normalizeCondition = (cond) => ({
  id: entityId("condition", cond.source, cond.name),
  kind: "condition",
  name: cond.name,
  source: cond.source,
  sourceType: classifySource(cond.source),
  data: {
    page: cond.page ?? null,
    entries: normalizeEntries(cond.entries),
  },
});

const normalizeRace = (race) => ({
  id: entityId("race", race.source, race.name),
  kind: "race",
  name: race.name,
  source: race.source,
  sourceType: classifySource(race.source),
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
  sourceType: classifySource(spell.source),
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

const normalizeFeat = (feat) => ({
  id: entityId("feat", feat.source, feat.name),
  kind: "feat",
  name: feat.name,
  source: feat.source,
  sourceType: classifySource(feat.source),
  data: {
    page: feat.page ?? null,
    prerequisite: feat.prerequisite ?? [],
    ability: feat.ability ?? [],
    category: feat.category ?? null,
    entries: normalizeEntries(feat.entries),
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

  const bestiaryIndex = await readJson("bestiary", "index.json");
  const monsterFiles = await Promise.all(
    Object.values(bestiaryIndex).map((fileName) => readJson("bestiary", fileName).catch(() => ({ monster: [] }))),
  );
  const monsters = monsterFiles
    .flatMap((file) => file.monster ?? [])
    .filter((m) => m.name && !m._copy)
    .map(normalizeMonster);

  const condFile = await readJson("conditionsdiseases.json");
  const conditionMap = new Map();
  for (const c of condFile.condition ?? []) {
    const norm = normalizeCondition(c);
    const key = c.name.toLowerCase();
    const existing = conditionMap.get(key);
    if (!existing || (norm.source === "XPHB" && existing.source !== "XPHB")) {
      conditionMap.set(key, norm);
    }
  }
  const conditions = [...conditionMap.values()].sort((a, b) => a.name.localeCompare(b.name));

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

  const featFile = await readJson("feats.json");
  const feats = (featFile.feat ?? [])
    .filter((feat) => feat.name && !feat._copy)
    .map(normalizeFeat)
    .sort((a, b) => a.name.localeCompare(b.name));

  const sources = [...new Set([
    ...classes.map((it) => it.source),
    ...subclasses.map((it) => it.source),
    ...races.map((it) => it.source),
    ...spells.map((it) => it.source),
    ...feats.map((it) => it.source),
  ])].sort();

  await writeJson("classes.json", classes);
  await writeJson("subclasses.json", subclasses);
  await writeJson("classFeatures.json", classFeatures);
  await writeJson("subclassFeatures.json", subclassFeatures);
  await writeJson("races.json", races);
  await writeJson("spells.json", spells);
  await writeJson("feats.json", feats);
  await writeJson("conditions.json", conditions);
  await writeJson("monsters.json", monsters);
  await writeJson("sources.json", sources);

  console.log(`Normalized ${classes.length} classes`);
  console.log(`Normalized ${subclasses.length} subclasses`);
  console.log(`Normalized ${classFeatures.length} class features`);
  console.log(`Normalized ${subclassFeatures.length} subclass features`);
  console.log(`Normalized ${races.length} races`);
  console.log(`Normalized ${spells.length} spells`);
  console.log(`Normalized ${feats.length} feats`);
  console.log(`Normalized ${conditions.length} conditions`);
  console.log(`Normalized ${monsters.length} monsters`);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
