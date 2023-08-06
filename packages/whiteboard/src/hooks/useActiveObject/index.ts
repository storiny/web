import { BaseFabricObject } from "fabric";
import React from "react";

import { isInteractiveObject } from "../../utils";
import { useCanvas } from "../index";

/**
 * Returns the current active object
 */
export const useActiveObject = (): BaseFabricObject | null => {
  const canvas = useCanvas();
  const [activeObject, setActiveObject] =
    React.useState<BaseFabricObject | null>(null);

  React.useEffect(() => {
    const { current } = canvas;

    /**
     * Updates the active object
     */
    const updateObject = (): void => {
      if (current) {
        const object = current.getActiveObject();
        setActiveObject(object as BaseFabricObject);
      }
    };

    if (current) {
      current.on("selection:created", updateObject);
      current.on("selection:updated", updateObject);
      current.on("selection:cleared", updateObject);
    }

    updateObject();

    return () => {
      if (current) {
        current.off("selection:created", updateObject);
        current.off("selection:updated", updateObject);
        current.off("selection:cleared", updateObject);
      }
    };
  }, [canvas]);

  if (!activeObject || !isInteractiveObject(activeObject)) {
    return null;
  }

  return activeObject;
};
