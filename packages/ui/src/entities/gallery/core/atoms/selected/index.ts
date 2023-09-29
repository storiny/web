import { AssetRating } from "@storiny/shared";
import { atomWithReset as atom_with_reset } from "jotai/utils";

export type SelectedAtomValue = {
  alt: string;
  credits?: { author: string; url: string };
  height: number;
  hex: string;
  key: string;
  rating: AssetRating;
  source: "pexels" | "native";
  src: string;
  width: number;
} | null;

export const selected_atom = atom_with_reset<SelectedAtomValue>(null);
