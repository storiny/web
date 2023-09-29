import { atom } from "jotai";

import { DEFAULT_TOOL, Tool } from "../../constants";

export const tool_atom = atom<Tool>(DEFAULT_TOOL);
