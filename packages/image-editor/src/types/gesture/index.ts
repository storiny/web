import { PointerCoords } from "../../store";

export interface Gesture {
  initialDistance: number | null;
  initialScale: number | null;
  lastCenter: { x: number; y: number } | null;
  pointers: Map<number, PointerCoords>;
}

export declare class GestureEvent extends UIEvent {
  readonly rotation: number;
  readonly scale: number;
}
