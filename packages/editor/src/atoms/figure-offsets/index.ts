import { atom } from "jotai";

export const figureOffsetsAtom = atom<
  Record<string, [node: Element, top: number]>
>({});
