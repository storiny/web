import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { nanoid } from "nanoid";

import {
  Arrowhead,
  ChartType,
  DEFAULT_FONT_FAMILY,
  DEFAULT_FONT_SIZE,
  DEFAULT_LAYER_PROPS,
  DEFAULT_TEXT_ALIGN,
  StrokeRoundness,
  TextAlign
} from "../../../constants";
import { Layer } from "../../../types";

export type CurrentLayerProps = Pick<
  Layer,
  | "backgroundColor"
  | "fillStyle"
  | "opacity"
  | "roughness"
  | "strokeColor"
  | "strokeStyle"
  | "strokeWidth"
> & {
  chartType: ChartType;
  endArrowhead: Arrowhead | null;
  fontFamily: string;
  fontSize: number;
  roundness: StrokeRoundness;
  startArrowhead: Arrowhead | null;
  textAlign: TextAlign;
};

export type LayersState = {
  items: Layer[];
  props: CurrentLayerProps;
  selected: string | null;
};

export const layersInitialState: LayersState = {
  selected: null,
  items: [],
  props: {
    backgroundColor: DEFAULT_LAYER_PROPS.backgroundColor,
    chartType: ChartType.BAR,
    endArrowhead: Arrowhead.ARROW,
    fillStyle: DEFAULT_LAYER_PROPS.fillStyle,
    fontFamily: DEFAULT_FONT_FAMILY,
    fontSize: DEFAULT_FONT_SIZE,
    opacity: DEFAULT_LAYER_PROPS.opacity,
    roughness: DEFAULT_LAYER_PROPS.roughness,
    roundness: StrokeRoundness.ROUND,
    startArrowhead: null,
    strokeColor: DEFAULT_LAYER_PROPS.strokeColor,
    strokeStyle: DEFAULT_LAYER_PROPS.strokeStyle,
    strokeWidth: DEFAULT_LAYER_PROPS.strokeWidth,
    textAlign: DEFAULT_TEXT_ALIGN
  }
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
