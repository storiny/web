import { atom } from "jotai";

import { DEFAULT_TOOL, Tool } from "../../constants";

export const toolAtom = atom<Tool>(DEFAULT_TOOL);
