import { atom, WritableAtom } from "jotai";

import { clamp } from "~/utils/clamp";

import {
  DEFAULT_ZOOM_LEVEL,
  MAX_ZOOM_LEVEL,
  MIN_ZOOM_LEVEL
} from "../../constants";

export const zoomAtom: WritableAtom<number, number[], number> = atom(
  DEFAULT_ZOOM_LEVEL,
  (_, set, newZoom) =>
    set(zoomAtom, clamp(MIN_ZOOM_LEVEL, newZoom, MAX_ZOOM_LEVEL))
);
