import { atom } from "jotai";

import { Alignment } from "../../constants";

export const alignment_atom = atom<Alignment | undefined>(Alignment.LEFT);
