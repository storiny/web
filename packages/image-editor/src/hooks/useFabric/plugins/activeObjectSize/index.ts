import { BaseFabricObject, Canvas, Text } from "fabric";

import { CURSORS } from "../../../../constants";
import { getObjectById, isGroup } from "../../../../utils";

/**
 * Positions the tooltip below the object
 * @param object Host object
 * @param tooltip Tooltip object
 */
const positionTooltipToObject = (
  object: BaseFabricObject,
  tooltip: BaseFabricObject
): void => {
  const [tl, tr, br, bl] = object.getCoords(true);
  tooltip.set({
    left: br.x,
    top: Math.max(tl.y, tr.y, br.y, bl.y)
  });
};

/**
 * Active object size plugin
 * @param canvas Canvas
 */
export const registerActiveObjectSize = (canvas: Canvas): void => {
  /**
   * Returns the tooltip
   */
  const getTooltips = (): BaseFabricObject[] =>
    canvas.getObjects().filter((object) => object.get("tooltip") === "size");

  /**
   * Removes the previous tooltip
   */
  const removePrevTooltips = (): void => {
    canvas.remove(...getTooltips());

    for (const object of canvas.getObjects()) {
      object.set({
        tooltipHostId: undefined
      });
    }
  };

  /**
   * Hides all the tooltips
   */
  const hideTooltips = (): void => {
    for (const tooltip of getTooltips()) {
      tooltip.set({ visible: false });
    }
  };

  /**
   * Shows all the tooltips
   */
  const showTooltips = (): void => {
    for (const tooltip of getTooltips()) {
      tooltip.set({ visible: true });
    }
  };

  /**
   * Renders the size tooltip
   * @param host Host object
   */
  const renderTooltip = (host: BaseFabricObject): void => {
    if (host.group || isGroup(host)) {
      return;
    }

    const hostSize = `${host.width}x${host.height}`;

    const text = new Text(hostSize, {
      fill: "black",
      tooltip: "size",
      locked: true,
      selectable: false,
      hasControls: false,
      hoverCursor: CURSORS.default
    });

    text.set("tooltipHostId", host.get("id"));
    positionTooltipToObject(host, text);

    canvas.add(text);
    canvas.renderAll();
  };

  canvas.on("selection:created", (options) => {
    removePrevTooltips();
    const [object] = options.selected;
    renderTooltip(object);
  });

  canvas.on("selection:updated", (options) => {
    removePrevTooltips();
    const [object] = options.selected;
    renderTooltip(object);
  });

  canvas.on("mouse:up", () => {
    for (const tooltip of getTooltips()) {
      const host = getObjectById(canvas, tooltip.get("tooltipHostId"));

      if (host) {
        positionTooltipToObject(host, tooltip);
      }
    }

    showTooltips();
  });

  canvas.on("object:moving", hideTooltips);
  canvas.on("object:scaling", hideTooltips);
  canvas.on("object:rotating", hideTooltips);
  canvas.on("object:modified", hideTooltips);
  canvas.on("selection:cleared", removePrevTooltips);
};
