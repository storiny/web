import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { clamp } from "~/utils/clamp";

import {
  CanvasPattern,
  DEFAULT_CANVAS_PATTERN,
  DEFAULT_ZOOM_LEVEL,
  MAX_ZOOM_LEVEL,
  MIN_ZOOM_LEVEL
} from "../../../constants";

export interface RootState {
  pattern: CanvasPattern;
  zoom: number;
}

export const rootInitialState: RootState = {
  zoom: DEFAULT_ZOOM_LEVEL,
  pattern: DEFAULT_CANVAS_PATTERN
};

export const rootSlice = createSlice({
  name: "root",
  initialState: rootInitialState,
  reducers: {
    setZoom: (state, action: PayloadAction<number>) => {
      state.zoom = Math.round(
        clamp(MIN_ZOOM_LEVEL, action.payload, MAX_ZOOM_LEVEL)
      );
    },
    setPattern: (state, action: PayloadAction<CanvasPattern>) => {
      state.pattern = action.payload;
    }
  }
});

const { setZoom, setPattern } = rootSlice.actions;

export { setPattern, setZoom };
export default rootSlice.reducer;
