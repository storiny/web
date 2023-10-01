import { BaseFabricObject } from "fabric";
import React from "react";

import IconButton from "~/components/icon-button";
import Input from "~/components/input";
import EyeIcon from "~/icons/eye";
import EyeClosedIcon from "~/icons/eye-closed";
import RoughnessIcon from "~/icons/roughness";
import { clamp } from "~/utils/clamp";

import { MAX_OPACITY, MIN_OPACITY } from "../../../../../constants";
import { use_active_object, use_event_render } from "../../../../../hooks";
import { modify_object } from "../../../../../utils";
import DrawItem, { DrawItemRow } from "../../item";

// Opacity

const OpacityControl = ({
  active_object
}: {
  active_object: BaseFabricObject;
}): React.ReactElement => {
  use_event_render(
    "object:modified",
    (options) => options.target.get("id") === active_object.get("id")
  );

  /**
   * Mutates the opacity of the object
   */
  const change_opacity = React.useCallback(
    (next_opacity: number) => {
      if (active_object) {
        modify_object(active_object, {
          opacity: next_opacity / 100
        });
      }
    },
    [active_object]
  );

  /**
   * Toggles the layer's visibility
   */
  const toggle_layer_visibility = (): void => {
    modify_object(active_object, {
      visible: !active_object.visible
    });
  };

  return (
    <Input
      aria-label={"Layer opacity"}
      defaultValue={Math.round(active_object.opacity * 100)}
      end_decorator={
        <IconButton
          aria-label={`${!active_object.visible ? "Show" : "Hide"} layer`}
          onClick={toggle_layer_visibility}
          title={`${!active_object.visible ? "Show" : "Hide"} layer`}
        >
          {!active_object.visible ? <EyeClosedIcon /> : <EyeIcon />}
        </IconButton>
      }
      max={MAX_OPACITY}
      min={MIN_OPACITY}
      monospaced
      onChange={(event): void => {
        const value = Number.parseInt(event.target.value, 10) ?? 100;
        change_opacity(clamp(MIN_OPACITY, value, MAX_OPACITY));
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
  active_object
}: {
  active_object: BaseFabricObject;
}): React.ReactElement => {
  /**
   * Mutates the roughness of the object
   */
  const change_roughness = React.useCallback(
    (next_roughness: number) => {
      if (active_object) {
        modify_object(active_object, {
          roughness: next_roughness
        });
      }
    },
    [active_object]
  );

  return (
    <Input
      aria-label={"Layer roughness"}
      decorator={<RoughnessIcon />}
      defaultValue={active_object.get("roughness")}
      max={5}
      min={0}
      monospaced
      onChange={(event): void =>
        change_roughness(Number.parseFloat(event.target.value) ?? 1)
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
  disable_roughness
}: {
  disable_roughness?: boolean;
}): React.ReactElement | null => {
  const active_object = use_active_object();

  if (!active_object) {
    return null;
  }

  return (
    <DrawItem key={active_object.get("id")} label={"Layer"}>
      <DrawItemRow>
        <OpacityControl active_object={active_object} />
      </DrawItemRow>
      {!disable_roughness && (
        <DrawItemRow>
          <RoughnessControl active_object={active_object} />
        </DrawItemRow>
      )}
    </DrawItem>
  );
};

export default LayerProps;
