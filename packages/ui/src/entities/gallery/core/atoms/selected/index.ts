import { AssetRating } from "@storiny/shared";
import { atom } from "jotai";

export type SelectedAtomValue = {
  alt: string;
  height: number;
  hex: string;
  key: string;
  rating: AssetRating;
  source: "pexels" | "native";
  src: string;
  width: number;
} | null;

export const selectedAtom = atom<SelectedAtomValue>(null);
