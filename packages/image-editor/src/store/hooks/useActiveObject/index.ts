import { BaseFabricObject } from "fabric";
import React from "react";

import { useCanvas } from "../../../hooks";
import { getObjectById } from "../../../utils/getObjectById";
import { selectActiveLayers } from "../../features";
import { useEditorSelector } from "../store";

/**
 * Returns the current active object
 */
export const useActiveObject = (): BaseFabricObject | null => {
  const canvas = useCanvas();
  const activeLayers = useEditorSelector(selectActiveLayers);
  const activeObject = React.useMemo(
    () => getObjectById(canvas?.current, activeLayers?.[0]?.id),
    [activeLayers, canvas]
  );

  if (activeLayers.length !== 1) {
    return null;
  }

  return activeObject || null;
};
