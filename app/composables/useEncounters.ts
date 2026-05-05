import type { Encounter, CustomMonster } from "~/types/encounter";

const ENC_KEY = "character-forge.encounters.v1";
const MON_KEY = "character-forge.custom-monsters.v1";

const readEnc = (): Encounter[] => {
  if (!import.meta.client) return [];
  const raw = localStorage.getItem(ENC_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw) as Encounter[]; } catch { return []; }
};

const readMon = (): CustomMonster[] => {
  if (!import.meta.client) return [];
  const raw = localStorage.getItem(MON_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw) as CustomMonster[]; } catch { return []; }
};

export const useEncounters = () => {
  const encounters = useState<Encounter[]>("encounters", () => []);
  const customMonsters = useState<CustomMonster[]>("custom-monsters", () => []);

  const persistEnc = () => { if (import.meta.client) localStorage.setItem(ENC_KEY, JSON.stringify(encounters.value)); };
  const persistMon = () => { if (import.meta.client) localStorage.setItem(MON_KEY, JSON.stringify(customMonsters.value)); };

  const load = () => {
    encounters.value = readEnc();
    customMonsters.value = readMon();
  };

  const upsert = (e: Encounter) => {
    const idx = encounters.value.findIndex((x) => x.id === e.id);
    const next = { ...e, updatedAt: new Date().toISOString() };
    encounters.value = idx === -1 ? [next, ...encounters.value] : encounters.value.map((x) => x.id === e.id ? next : x);
    persistEnc();
    return next;
  };

  const remove = (id: string) => {
    encounters.value = encounters.value.filter((e) => e.id !== id);
    persistEnc();
  };

  const upsertMonster = (m: CustomMonster) => {
    const idx = customMonsters.value.findIndex((x) => x.id === m.id);
    customMonsters.value = idx === -1 ? [m, ...customMonsters.value] : customMonsters.value.map((x) => x.id === m.id ? m : x);
    persistMon();
    return m;
  };

  const removeMonster = (id: string) => {
    customMonsters.value = customMonsters.value.filter((m) => m.id !== id);
    persistMon();
  };

  return { encounters, customMonsters, load, upsert, remove, upsertMonster, removeMonster };
};
