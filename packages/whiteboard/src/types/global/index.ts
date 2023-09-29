import { Canvas as CanvasPrimitive } from "fabric";

import {
  DrawPlugin,
  HistoryPlugin,
  PanPlugin
} from "../../hooks/use-fabric/plugins";

declare module "fabric" {
  // @ts-expect-error fabric canvas
  export interface Canvas extends CanvasPrimitive {
    draw_manager: DrawPlugin;
    history_manager: HistoryPlugin;
    pan_manager: PanPlugin;
  }
}
