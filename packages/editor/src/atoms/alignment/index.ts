import { atom } from "jotai";

import { Alignment } from "../../constants";

export const alignmentAtom = atom<Alignment | undefined>(Alignment.LEFT);
