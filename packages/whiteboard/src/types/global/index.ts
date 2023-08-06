import { Canvas as CanvasPrimitive } from "fabric";

import {
  DrawPlugin,
  HistoryPlugin,
  PanPlugin
} from "../../hooks/useFabric/plugins";

declare module "fabric" {
  // @ts-ignore
  export interface Canvas extends CanvasPrimitive {
    drawManager: DrawPlugin;
    historyManager: HistoryPlugin;
    panManager: PanPlugin;
  }
}
