import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { clamp } from "~/utils/clamp";

import {
  CanvasPattern,
  DEFAULT_CANVAS_PATTERN,
  DEFAULT_DIMENSION,
  DEFAULT_ROTATION,
  DEFAULT_ZOOM_LEVEL,
  Dimension,
  MAX_DIMENSION,
  MAX_ROTATION,
  MAX_ZOOM_LEVEL,
  MIN_DIMENSION,
  MIN_ROTATION,
  MIN_ZOOM_LEVEL
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
      const { height, width } = action.payload;
      state.dimension = {
        height: clamp(MIN_DIMENSION, height, MAX_DIMENSION),
        width: clamp(MIN_DIMENSION, width, MAX_DIMENSION)
      };
    },
    setPattern: (state, action: PayloadAction<CanvasPattern>) => {
      state.pattern = action.payload;
    },
    setRotation: (state, action: PayloadAction<number>) => {
      state.rotation = clamp(MIN_ROTATION, action.payload, MAX_ROTATION);
    },
    setZoom: (state, action: PayloadAction<number>) => {
      state.zoom = clamp(MIN_ZOOM_LEVEL, action.payload, MAX_ZOOM_LEVEL);
    }
  }
});

const { setDimension, setPattern, setRotation, setZoom } = rootSlice.actions;

export { setDimension, setPattern, setRotation, setZoom };
export default rootSlice.reducer;
