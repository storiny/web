import { Rect } from "fabric";
import React from "react";

import Input from "~/components/Input";
import AngleIcon from "~/icons/Angle";
import CornerRadiusIcon from "~/icons/CornerRadius";
import { clamp } from "~/utils/clamp";

import { MAX_ANGLE, MIN_ANGLE } from "../../../../../constants";
import {
  mutateLayer,
  selectActiveLayer,
  useActiveObject,
  useEditorDispatch,
  useEditorSelector
} from "../../../../../store";
import DrawItem, { DrawItemRow } from "../../Item";

const ObjectProps = (): React.ReactElement | null => {
  const activeObject = useActiveObject();
  const activeLayer = useEditorSelector(selectActiveLayer);
  const dispatch = useEditorDispatch();

  if (!activeLayer || !activeObject) {
    return null;
  }

  /**
   * Mutates the angle of the object
   * @param angle New angle
   */
  const changeAngle = (angle: number): void => {
    dispatch(mutateLayer({ id: activeLayer.id, angle }));
  };

  /**
   * Mutates the corner radius of the object
   * @param cornerRadius New corner radius
   */
  const changeCornerRadius = (cornerRadius: number): void => {
    if (activeObject) {
      activeObject.set({
        rx: cornerRadius,
        ry: cornerRadius
      });
      activeObject.canvas?.renderAll();
    }
  };

  return (
    <DrawItem>
      <DrawItemRow>
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
          value={Math.round(activeLayer.angle)}
        />
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
      </DrawItemRow>
    </DrawItem>
  );
};

export default ObjectProps;
