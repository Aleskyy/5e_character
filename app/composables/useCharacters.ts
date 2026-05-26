import type { CharacterDraft } from "~/types/character";
import { normalizeCharacter } from "~/utils/character";

const STORAGE_KEY = "character-forge.characters.v1";

const readCharacters = () => {
  if (!import.meta.client) return [];

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    return (JSON.parse(raw) as (Partial<CharacterDraft> & { gold?: number })[]).map(normalizeCharacter);
  } catch {
    return [];
  }
};

export const useCharacters = () => {
  const characters = useState<CharacterDraft[]>("characters", () => []);

  const persist = () => {
    if (!import.meta.client) return;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(characters.value));
  };

  const load = () => {
    characters.value = readCharacters();
  };

  const save = (character: CharacterDraft) => {
    const now = new Date().toISOString();
    const nextCharacter = normalizeCharacter({ ...character, updatedAt: now });
    const index = characters.value.findIndex((item) => item.id === character.id);

    if (index === -1) {
      characters.value = [nextCharacter, ...characters.value];
    } else {
      characters.value = characters.value.map((item) =>
        item.id === character.id ? nextCharacter : item,
      );
    }

    persist();
    return nextCharacter;
  };

  const remove = (id: string) => {
    characters.value = characters.value.filter((character) => character.id !== id);
    persist();
  };

  return {
    characters,
    load,
    save,
    remove,
  };
};
