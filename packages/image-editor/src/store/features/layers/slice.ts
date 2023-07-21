import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { nanoid } from "nanoid";

import { Layer } from "../../../types";

export interface LayersState {
  layers: Layer[];
  selected: string | null;
}

export const layersInitialState: LayersState = {
  selected: null,
  layers: []
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
      state.layers.unshift({
        ...action.payload,
        id: layerId
      } as Layer);
      state.selected = layerId; // Select new layer
    },
    mutateLayer: (
      state,
      action: PayloadAction<Partial<Omit<Layer, "id">> & { id: string }>
    ) => {
      const { id, ...rest } = action.payload;
      const layerIndex = state.layers.findIndex((layer) => layer.id === id);

      if (layerIndex > -1) {
        Object.assign(state.layers[layerIndex], rest);
      }
    },
    reorderLayer: (
      state,
      action: PayloadAction<{ endIndex: number; startIndex: number }>
    ) => {
      const { startIndex, endIndex } = action.payload;
      const layers = state.layers;
      const [removed] = layers.splice(startIndex, 1);
      layers.splice(endIndex, 0, removed);
      state.layers = layers;
    },
    setActiveLayer: (state, action: PayloadAction<string>) => {
      state.selected = action.payload;
    },
    setLayerName: (
      state,
      action: PayloadAction<{ id: string; name: string }>
    ) => {
      const { id, name } = action.payload;
      const layer = state.layers.find((layer) => layer.id === id);

      if (layer) {
        layer.name = name;
      }
    },
    toggleLayerVisibility: (state, action: PayloadAction<string>) => {
      const layer = state.layers.find((layer) => layer.id === action.payload);

      if (layer) {
        layer.hidden = !layer.hidden;
      }
    },
    toggleLayerLock: (state, action: PayloadAction<string>) => {
      const layer = state.layers.find((layer) => layer.id === action.payload);

      if (layer) {
        layer.locked = !layer.locked;
      }
    },
    removeLayer: (state, action: PayloadAction<string>) => {
      const layer = state.layers.find((layer) => layer.id === action.payload);

      if (layer) {
        state.layers = state.layers.filter(
          (layer) => layer.id !== action.payload
        );
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
  reorderLayer,
  mutateLayer
} = layersSlice.actions;

export {
  addLayer,
  mutateLayer,
  removeLayer,
  reorderLayer,
  setActiveLayer,
  setLayerName,
  toggleLayerLock,
  toggleLayerVisibility
};

export default layersSlice.reducer;
