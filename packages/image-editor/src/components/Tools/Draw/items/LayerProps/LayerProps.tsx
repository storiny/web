import React from "react";

import IconButton from "~/components/IconButton";
import Input from "~/components/Input";
import AngleIcon from "~/icons/Angle";
import EyeIcon from "~/icons/Eye";
import EyeClosedIcon from "~/icons/EyeClosed";
import { clamp } from "~/utils/clamp";

import {
  MAX_ANGLE,
  MAX_OPACITY,
  MIN_ANGLE,
  MIN_OPACITY
} from "../../../../../constants";
import {
  mutateLayer,
  selectActiveLayer,
  toggleLayerVisibility,
  useEditorDispatch,
  useEditorSelector
} from "../../../../../store";
import DrawItem from "../../Item";

const LayerProps = (): React.ReactElement | null => {
  const activeLayer = useEditorSelector(selectActiveLayer);
  const dispatch = useEditorDispatch();

  if (!activeLayer) {
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
   * Mutates the opacity of the object
   * @param opacity New opacity
   */
  const changeOpacity = (opacity: number): void => {
    dispatch(mutateLayer({ id: activeLayer.id, opacity }));
  };

  return (
    <DrawItem label={"Layer"}>
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
        aria-label={"Layer opacity"}
        endDecorator={
          <IconButton
            aria-label={`${activeLayer.hidden ? "Show" : "Hide"} layer`}
            onClick={(): void => {
              dispatch(toggleLayerVisibility(activeLayer.id));
            }}
            title={`${activeLayer.hidden ? "Show" : "Hide"} layer`}
          >
            {activeLayer.hidden ? <EyeClosedIcon /> : <EyeIcon />}
          </IconButton>
        }
        max={MAX_OPACITY}
        min={MIN_OPACITY}
        monospaced
        onChange={(event): void => {
          const value = Number.parseInt(event.target.value, 10) ?? 100;
          changeOpacity(clamp(MIN_OPACITY, value, MAX_OPACITY));
        }}
        placeholder={"Opacity"}
        size={"sm"}
        title={"Opacity"}
        type={"number"}
        value={activeLayer.opacity}
      />
    </DrawItem>
  );
};

export default LayerProps;
