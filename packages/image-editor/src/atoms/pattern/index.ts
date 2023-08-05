import { atom } from "jotai";

import { CanvasPattern, DEFAULT_CANVAS_PATTERN } from "../../constants";

export const patternAtom = atom<CanvasPattern>(DEFAULT_CANVAS_PATTERN);
