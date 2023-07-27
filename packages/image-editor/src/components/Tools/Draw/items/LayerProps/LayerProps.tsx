import { BaseFabricObject } from "fabric";
import React from "react";

import IconButton from "~/components/IconButton";
import Input from "~/components/Input";
import EyeIcon from "~/icons/Eye";
import EyeClosedIcon from "~/icons/EyeClosed";
import RoughnessIcon from "~/icons/Roughness";
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

// Opacity

const OpacityControl = ({
  activeObject
}: {
  activeObject: BaseFabricObject;
}): React.ReactElement | null => {
  const activeLayer = useEditorSelector(selectActiveLayer);
  const dispatch = useEditorDispatch();

  /**
   * Mutates the opacity of the object
   */
  const changeOpacity = React.useCallback(
    (opacity: number) => {
      if (activeObject) {
        activeObject.set({
          opacity: opacity / 100,
          dirty: true
        });
        activeObject.canvas?.requestRenderAll();
      }
    },
    [activeObject]
  );

  if (!activeLayer) {
    return null;
  }

  return (
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
  );
};

// Roughness

const RoughnessControl = ({
  activeObject
}: {
  activeObject: BaseFabricObject;
}): React.ReactElement => {
  /**
   * Mutates the roughness of the object
   */
  const changeRoughness = React.useCallback(
    (roughness: number) => {
      if (activeObject) {
        activeObject.set({
          roughness,
          dirty: true
        });
        activeObject.canvas?.requestRenderAll();
      }
    },
    [activeObject]
  );

  return (
    <Input
      aria-label={"Layer roughness"}
      decorator={<RoughnessIcon />}
      defaultValue={activeObject.get("roughness")}
      max={5}
      min={0}
      monospaced
      onChange={(event): void =>
        changeRoughness(Number.parseFloat(event.target.value) ?? 1)
      }
      placeholder={"Roughness"}
      size={"sm"}
      step={0.1}
      title={"Roughness"}
      type={"number"}
    />
  );
};

const LayerProps = (): React.ReactElement | null => {
  const activeObject = useActiveObject();

  if (!activeObject) {
    return null;
  }

  return (
    <DrawItem label={"Layer"}>
      <DrawItemRow>
        <OpacityControl activeObject={activeObject} />
      </DrawItemRow>
      <DrawItemRow>
        <RoughnessControl activeObject={activeObject} />
      </DrawItemRow>
    </DrawItem>
  );
};

export default LayerProps;
