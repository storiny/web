import { atom } from "jotai";

import { SkinTone } from "../../constants";

export const skin_tone_atom = atom<{
  active: SkinTone;
  hover: SkinTone | null;
}>({
  active: SkinTone.DEFAULT,
  hover: null
});
