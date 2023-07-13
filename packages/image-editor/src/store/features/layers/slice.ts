import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { nanoid } from "nanoid";

import { Layer, LayerType } from "../../../constants";

const mainImageId = nanoid();

export type LayersState = {
  items: Layer[];
  selected: string;
};

export const layersInitialState: LayersState = {
  selected: mainImageId,
  items: [
    {
      id: mainImageId,
      name: "Main image",
      hidden: false,
      locked: false,
      type: LayerType.MAIN_IMAGE
    }
  ]
};

export const layersSlice = createSlice({
  name: "layers",
  initialState: layersInitialState,
  reducers: {
    addLayer: (state, action: PayloadAction<Layer>) => {
      state.items.unshift(action.payload);
      state.selected = action.payload.id; // Select new layer
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

      // The main image is not removeable
      if (layer && layer.type !== LayerType.MAIN_IMAGE) {
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
