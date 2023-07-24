import React from "react";

import IconButton from "~/components/IconButton";
import Input from "~/components/Input";
import EyeIcon from "~/icons/Eye";
import EyeClosedIcon from "~/icons/EyeClosed";
import { clamp } from "~/utils/clamp";

import { MAX_OPACITY, MIN_OPACITY } from "../../../../../constants";
import {
  selectActiveLayer,
  toggleLayerVisibility,
  useActiveObject,
  useEditorDispatch,
  useEditorSelector
} from "../../../../../store";
import DrawItem, { DrawItemRow } from "../../Item";

const LayerProps = (): React.ReactElement | null => {
  const activeLayer = useEditorSelector(selectActiveLayer);
  const activeObject = useActiveObject();
  const dispatch = useEditorDispatch();

  if (!activeObject || !activeLayer) {
    return null;
  }

  /**
   * Mutates the opacity of the object
   * @param opacity New opacity
   */
  const changeOpacity = (opacity: number): void => {
    if (activeObject) {
      activeObject.set({
        opacity: opacity / 100
      });
      activeObject.canvas?.renderAll();
    }
  };

  return (
    <DrawItem label={"Layer"}>
      <DrawItemRow>
        <Input
          aria-label={"Layer opacity"}
          defaultValue={Math.round(activeObject.opacity * 100)}
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
        />
      </DrawItemRow>
    </DrawItem>
  );
};

export default LayerProps;
