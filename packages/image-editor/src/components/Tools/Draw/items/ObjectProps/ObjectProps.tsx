import { BaseFabricObject, Rect } from "fabric";
import React from "react";

import Input from "~/components/Input";
import AngleIcon from "~/icons/Angle";
import CornerRadiusIcon from "~/icons/CornerRadius";
import { clamp } from "~/utils/clamp";

import { MAX_ANGLE, MIN_ANGLE } from "../../../../../constants";
import { useActiveObject, useEventRender } from "../../../../../store";
import DrawItem, { DrawItemRow } from "../../Item";

// Angle

const AngleControl = ({
  activeObject
}: {
  activeObject: BaseFabricObject;
}): React.ReactElement => {
  useEventRender(
    "object:rotating",
    (options) => options.target.get("id") === activeObject.get("id")
  );

  /**
   * Mutates the angle of the object
   * @param angle New angle
   */
  const changeAngle = React.useCallback(
    (angle: number) => {
      if (activeObject) {
        activeObject.rotate(angle);

        if (activeObject.canvas) {
          activeObject.canvas?.requestRenderAll();
          activeObject.canvas?.fire?.("object:rotating", {
            target: activeObject
          } as any);
        }
      }
    },
    [activeObject]
  );

  return (
    <Input
      aria-label={"Layer angle"}
      decorator={<AngleIcon />}
      max={MAX_ANGLE}
      min={MIN_ANGLE}
      monospaced
      onChange={(event): void => {
        const value = Number.parseInt(event.target.value, 10) ?? 0;
        changeAngle(clamp(MIN_ANGLE, value, MAX_ANGLE));
      }}
      placeholder={"Angle"}
      size={"sm"}
      title={"Angle"}
      type={"number"}
      value={Math.round(activeObject.angle)}
    />
  );
};

// Corner radius

const CornerRadiusControl = ({
  activeObject
}: {
  activeObject: BaseFabricObject;
}): React.ReactElement => {
  /**
   * Mutates the corner radius of the object
   * @param cornerRadius New corner radius
   */
  const changeCornerRadius = React.useCallback(
    (cornerRadius: number) => {
      if (activeObject) {
        activeObject.set({
          rx: cornerRadius,
          ry: cornerRadius,
          dirty: true
        });
        activeObject.canvas?.requestRenderAll();
      }
    },
    [activeObject]
  );

  return (
    <Input
      aria-label={"Layer corner radius"}
      decorator={<CornerRadiusIcon />}
      defaultValue={Math.max(
        (activeObject as Rect).rx,
        (activeObject as Rect).ry
      )}
      min={0}
      monospaced
      onChange={(event): void => {
        const value = Number.parseInt(event.target.value, 10) ?? 0;
        changeCornerRadius(clamp(0, value, Infinity));
      }}
      placeholder={"Corner radius"}
      size={"sm"}
      title={"Corner radius"}
      type={"number"}
    />
  );
};

const ObjectProps = (): React.ReactElement | null => {
  const activeObject = useActiveObject();

  if (!activeObject) {
    return null;
  }

  return (
    <DrawItem>
      <DrawItemRow>
        <AngleControl activeObject={activeObject} />
        <CornerRadiusControl activeObject={activeObject} />
      </DrawItemRow>
    </DrawItem>
  );
};

export default ObjectProps;
