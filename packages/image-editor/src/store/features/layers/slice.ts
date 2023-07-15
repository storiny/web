import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { nanoid } from "nanoid";

import { Layer } from "../../../types";

export type LayersState = {
  items: Layer[];
  selected: string | null;
};

export const layersInitialState: LayersState = {
  selected: null,
  items: []
};

export const layersSlice = createSlice({
  name: "layers",
  initialState: layersInitialState,
  reducers: {
    addLayer: (
      state,
      action: PayloadAction<Omit<Layer, "id"> & { id?: string }>
    ) => {
      const layerId = action.payload.id || nanoid();
      state.items.unshift({
        ...action.payload,
        id: layerId
      } as Layer);
      state.selected = layerId; // Select new layer
    },
    reorderLayer: (
      state,
      action: PayloadAction<{ endIndex: number; startIndex: number }>
    ) => {
      const { startIndex, endIndex } = action.payload;
      const items = state.items;
      const [removed] = items.splice(startIndex, 1);
      items.splice(endIndex, 0, removed);
      state.items = items;
    },
    setActiveLayer: (state, action: PayloadAction<string>) => {
      state.selected = action.payload;
    },
    setLayerName: (
      state,
      action: PayloadAction<{ id: string; name: string }>
    ) => {
      const { id, name } = action.payload;
      const layer = state.items.find((item) => item.id === id);

      if (layer) {
        layer.name = name;
      }
    },
    toggleLayerVisibility: (state, action: PayloadAction<string>) => {
      const layer = state.items.find((item) => item.id === action.payload);

      if (layer) {
        layer.hidden = !layer.hidden;
      }
    },
    toggleLayerLock: (state, action: PayloadAction<string>) => {
      const layer = state.items.find((item) => item.id === action.payload);

      if (layer) {
        layer.locked = !layer.locked;
      }
    },
    removeLayer: (state, action: PayloadAction<string>) => {
      const layer = state.items.find((item) => item.id === action.payload);

      if (layer) {
        state.items = state.items.filter((item) => item.id !== action.payload);
      }
    }
  }
});

const {
  addLayer,
  setActiveLayer,
  setLayerName,
  toggleLayerVisibility,
  toggleLayerLock,
  removeLayer,
  reorderLayer
} = layersSlice.actions;

export {
  addLayer,
  removeLayer,
  reorderLayer,
  setActiveLayer,
  setLayerName,
  toggleLayerLock,
  toggleLayerVisibility
};

export default layersSlice.reducer;
