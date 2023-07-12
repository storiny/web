import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { clamp } from "~/utils/clamp";

import {
  CanvasPattern,
  DEFAULT_CANVAS_PATTERN,
  DEFAULT_DIMENSION,
  DEFAULT_ROTATION,
  DEFAULT_ZOOM_LEVEL,
  Dimension,
  MAX_ROTATION,
  MIN_ROTATION
} from "../../../constants";

export type RootState = {
  dimension: Dimension;
  pattern: CanvasPattern;
  rotation: number;
  zoom: number;
};

export const rootInitialState: RootState = {
  dimension: DEFAULT_DIMENSION,
  pattern: DEFAULT_CANVAS_PATTERN,
  rotation: DEFAULT_ROTATION,
  zoom: DEFAULT_ZOOM_LEVEL
};

export const rootSlice = createSlice({
  name: "root",
  initialState: rootInitialState,
  reducers: {
    setDimension: (state, action: PayloadAction<Dimension>) => {
      state.dimension = action.payload;
    },
    setPattern: (state, action: PayloadAction<CanvasPattern>) => {
      state.pattern = action.payload;
    },
    setRotation: (state, action: PayloadAction<number>) => {
      state.rotation = action.payload;
    },
    setZoom: (state, action: PayloadAction<number>) => {
      state.zoom = clamp(MIN_ROTATION, action.payload, MAX_ROTATION);
    }
  }
});

const { setDimension, setPattern, setRotation, setZoom } = rootSlice.actions;

export { setDimension, setPattern, setRotation, setZoom };
export default rootSlice.reducer;
