import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { clamp } from "~/utils/clamp";

import {
  Cursor,
  DEFAULT_ZOOM_LEVEL,
  MAX_ZOOM_LEVEL,
  MIN_ZOOM_LEVEL
} from "../../../constants";

export interface RootState {
  cursor: Cursor;
  zoom: number;
}

export const rootInitialState: RootState = {
  cursor: Cursor.DEFAULT,
  zoom: DEFAULT_ZOOM_LEVEL
};

export const rootSlice = createSlice({
  name: "root",
  initialState: rootInitialState,
  reducers: {
    setZoom: (state, action: PayloadAction<number>) => {
      state.zoom = Math.round(
        clamp(MIN_ZOOM_LEVEL, action.payload, MAX_ZOOM_LEVEL)
      );
    }
  }
});

const { setZoom } = rootSlice.actions;

export { setZoom };
export default rootSlice.reducer;
