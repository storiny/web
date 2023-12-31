import { FabricObject } from "fabric";
import React from "react";

import { is_interactive_object } from "../../utils";
import { use_canvas } from "../use-canvas";

/**
 * Returns the current active object
 */
export const use_active_object = (): FabricObject | null => {
  const canvas = use_canvas();
  const [active_object, set_active_object] =
    React.useState<FabricObject | null>(null);

  React.useEffect(() => {
    const { current } = canvas;

    /**
     * Updates the active object
     */
    const update_object = (): void => {
      if (current) {
        const object = current.getActiveObject();
        set_active_object(object as FabricObject);
      }
    };

    if (current) {
      current.on("selection:created", update_object);
      current.on("selection:updated", update_object);
      current.on("selection:cleared", update_object);
    }

    update_object();

    return () => {
      if (current) {
        current.off("selection:created", update_object);
        current.off("selection:updated", update_object);
        current.off("selection:cleared", update_object);
      }
    };
  }, [canvas]);

  if (!active_object || !is_interactive_object(active_object)) {
    return null;
  }

  return active_object;
};
