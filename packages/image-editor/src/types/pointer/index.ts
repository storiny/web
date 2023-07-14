import { Layer, NonDeleted } from "../layer";

export interface PointerCoords {
  x: number;
  y: number;
}

export interface PointerDownState {
  boxSelection: {
    hasOccurred: boolean;
  };
  drag: {
    // Might change during the pointer interaction
    hasOccurred: boolean;
    // Might change during the pointer interaction
    offset: { x: number; y: number } | null;
  };
  // We need to have these in the state so that we can unsubscribe them
  eventListeners: {
    // Defined on the initial pointer down event
    onKeyDown: null | ((event: KeyboardEvent) => void);
    // Defined on the initial pointer down event
    onKeyUp: null | ((event: KeyboardEvent) => void);
    // Defined on the initial pointer down event
    onMove: null | ((args: unknown) => void);
    // Defined on the initial pointer down event
    onUp: null | ((event: PointerEvent) => void);
  };
  hit: {
    // The layers the pointer is hitting, determined on the initial
    // pointer down event
    allHitLayers: NonDeleted<Layer>[];
    // Whether selected layer(s) were duplicated, might change during the
    // pointer interaction
    hasBeenDuplicated: boolean;
    hasHitCommonBoundingBoxOfSelectedLayers: boolean;
    // The layer the pointer is hitting, determined on the initial
    // pointer down event
    layer: NonDeleted<Layer> | null;
    // This is determined on the initial pointer down event
    wasAddedToSelection: boolean;
  };
  // The previous pointer position
  lastCoords: { x: number; y: number };
  layerIdsToErase: {
    [key: Layer["id"]]: {
      erase: boolean;
      opacity: Layer["opacity"];
    };
  };
  // The first position at which pointerDown happened
  origin: { x: number; y: number };
  // Same as "origin" but snapped to the grid, if snapping is on
  originInGrid: { x: number; y: number };
  // Map of original layers data
  originalLayers: Map<string, NonDeleted<Layer>>;
  resize: {
    // This is determined on the initial pointer down event
    arrowDirection: "origin" | "end";
    // This is a center point of selected layers determined on the initial pointer down event (for rotation only)
    center: { x: number; y: number };
    // Handle when resizing, might change during the pointer interaction
    handleType: MaybeTransformHandleType;
    // This is determined on the initial pointer down event
    isResizing: boolean;
    // This is determined on the initial pointer down event
    offset: { x: number; y: number };
  };
  // Scrollbar checks
  scrollbars: {
    isOverEither: boolean;
    isOverHorizontal: boolean;
    isOverVertical: boolean;
  };
  withCmdOrCtrl: boolean;
}
