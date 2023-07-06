import { atom } from "jotai";

import { SkinTone } from "../../constants";

export const skinToneAtom = atom<SkinTone>(SkinTone.DEFAULT);
