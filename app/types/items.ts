import type { Ability } from "~/types/rules";

export type ItemType = "weapon" | "armor" | "container" | "consumable" | "misc";

export type CustomItem = {
  id: string;
  name: string;
  type: ItemType;
  damageAbility?: Ability;
  damage?: string;
  damageType?: string;
  weight?: number;
  acBonus?: number;
  isContainer?: boolean;
  isExtraplanar?: boolean;
  description?: string;
  createdAt: string;
};
