import { atom } from "jotai";

import { SkinTone } from "../../constants";

export const skinToneAtom = atom<{ active: SkinTone; hover: SkinTone | null }>({
  active: SkinTone.DEFAULT,
  hover: null
});
