import { Canvas as CanvasPrimitive } from "fabric";

import { HistoryPlugin } from "../../hooks/useFabric/plugins";

declare module "fabric" {
  // @ts-ignore
  export interface Canvas extends CanvasPrimitive {
    historyManager: HistoryPlugin;
  }
}
