import { BaseFabricObject } from "fabric";
import React from "react";

import IconButton from "~/components/IconButton";
import Input from "~/components/Input";
import EyeIcon from "~/icons/Eye";
import EyeClosedIcon from "~/icons/EyeClosed";
import RoughnessIcon from "~/icons/Roughness";
import { clamp } from "~/utils/clamp";

import { MAX_OPACITY, MIN_OPACITY } from "../../../../../constants";
import { useActiveObject, useEventRender } from "../../../../../hooks";
import { modifyObject } from "../../../../../utils";
import DrawItem, { DrawItemRow } from "../../Item";

// Opacity

const OpacityControl = ({
  activeObject
}: {
  activeObject: BaseFabricObject;
}): React.ReactElement => {
  useEventRender(
    "object:modified",
    (options) => options.target.get("id") === activeObject.get("id")
  );

  /**
   * Mutates the opacity of the object
   */
  const changeOpacity = React.useCallback(
    (opacity: number) => {
      if (activeObject) {
        modifyObject(activeObject, {
          opacity: opacity / 100
        });
      }
    },
    [activeObject]
  );

  /**
   * Toggles the layer's visibility
   */
  const toggleLayerVisibility = (): void => {
    modifyObject(activeObject, {
      visible: !activeObject.visible
    });
  };

  return (
    <Input
      aria-label={"Layer opacity"}
      defaultValue={Math.round(activeObject.opacity * 100)}
      endDecorator={
        <IconButton
          aria-label={`${!activeObject.visible ? "Show" : "Hide"} layer`}
          onClick={toggleLayerVisibility}
          title={`${!activeObject.visible ? "Show" : "Hide"} layer`}
        >
          {!activeObject.visible ? <EyeClosedIcon /> : <EyeIcon />}
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
        modifyObject(activeObject, {
          roughness
        });
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

const LayerProps = ({
  disableRoughness
}: {
  disableRoughness?: boolean;
}): React.ReactElement | null => {
  const activeObject = useActiveObject();

  if (!activeObject) {
    return null;
  }

  return (
    <DrawItem key={activeObject.get("id")} label={"Layer"}>
      <DrawItemRow>
        <OpacityControl activeObject={activeObject} />
      </DrawItemRow>
      {!disableRoughness && (
        <DrawItemRow>
          <RoughnessControl activeObject={activeObject} />
        </DrawItemRow>
      )}
    </DrawItem>
  );
};

export default LayerProps;
