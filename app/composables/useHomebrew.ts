import type { HomebrewEntry, HBSpell, HBRace, HBSubrace, HBClass, HBNpc } from "~/types/homebrew";

const STORAGE_KEY = "character-forge.homebrew.v1";

const read = (): HomebrewEntry[] => {
  if (!import.meta.client) return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw) as HomebrewEntry[]; } catch { return []; }
};

export const useHomebrew = () => {
  const entries = useState<HomebrewEntry[]>("homebrew-library", () => []);

  const persist = () => {
    if (!import.meta.client) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.value));
  };

  const load = () => { entries.value = read(); };

  const upsert = (entry: HomebrewEntry) => {
    const idx = entries.value.findIndex((e) => e.id === entry.id);
    entries.value = idx === -1
      ? [entry, ...entries.value]
      : entries.value.map((e) => e.id === entry.id ? entry : e);
    persist();
    return entry;
  };

  const remove = (id: string) => {
    entries.value = entries.value.filter((e) => e.id !== id);
    persist();
  };

  const spells = computed<HBSpell[]>(() => entries.value.filter((e): e is HBSpell => e.kind === "spell"));
  const races = computed<HBRace[]>(() => entries.value.filter((e): e is HBRace => e.kind === "race"));
  const subraces = computed<HBSubrace[]>(() => entries.value.filter((e): e is HBSubrace => e.kind === "subrace"));
  const classes = computed<HBClass[]>(() => entries.value.filter((e): e is HBClass => e.kind === "class"));
  const npcs = computed<HBNpc[]>(() => entries.value.filter((e): e is HBNpc => e.kind === "npc"));

  return { entries, spells, races, subraces, classes, npcs, load, upsert, remove };
};
