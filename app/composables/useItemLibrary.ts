import type { CustomItem } from "~/types/items";

const STORAGE_KEY = "character-forge.items.v1";

const readItems = (): CustomItem[] => {
  if (!import.meta.client) return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw) as CustomItem[]; } catch { return []; }
};

export const useItemLibrary = () => {
  const items = useState<CustomItem[]>("item-library", () => []);

  const persist = () => {
    if (!import.meta.client) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.value));
  };

  const load = () => { items.value = readItems(); };

  const upsert = (item: CustomItem) => {
    const idx = items.value.findIndex((i) => i.id === item.id);
    items.value = idx === -1
      ? [item, ...items.value]
      : items.value.map((i) => i.id === item.id ? item : i);
    persist();
    return item;
  };

  const remove = (id: string) => {
    items.value = items.value.filter((i) => i.id !== id);
    persist();
  };

  const findById = (id: string) => items.value.find((i) => i.id === id);

  return { items, load, upsert, remove, findById };
};
