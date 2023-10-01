import { BaseFabricObject, Rect } from "fabric";
import React from "react";

import Input from "~/components/input";
import AngleIcon from "~/icons/angle";
import CornerRadiusIcon from "~/icons/corner-radius";
import { clamp } from "~/utils/clamp";

import { MAX_ANGLE, MIN_ANGLE } from "../../../../../constants";
import { use_active_object, use_event_render } from "../../../../../hooks";
import { modify_object } from "../../../../../utils";
import DrawItem, { DrawItemRow } from "../../item";

// Angle

const AngleControl = ({
  active_object
}: {
  active_object: BaseFabricObject;
}): React.ReactElement => {
  use_event_render(
    "object:rotating",
    (options) => options.target.get("id") === active_object.get("id")
  );

  /**
   * Mutates the angle of the object
   */
  const change_angle = React.useCallback(
    (next_angle: number) => {
      if (active_object) {
        active_object.rotate(next_angle);

        if (active_object.canvas) {
          active_object.canvas?.requestRenderAll();
          active_object.canvas?.fire?.("object:rotating", {
            target: active_object
          } as any);
          active_object.canvas?.fire?.("object:modified", {
            target: active_object
          } as any);
        }
      }
    },
    [active_object]
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
        change_angle(clamp(MIN_ANGLE, value, MAX_ANGLE));
      }}
      placeholder={"Angle"}
      size={"sm"}
      title={"Angle"}
      type={"number"}
      value={Math.round(active_object.angle)}
    />
  );
};

// Corner radius

const CornerRadiusControl = ({
  active_object
}: {
  active_object: BaseFabricObject;
}): React.ReactElement => {
  /**
   * Mutates the corner radius of the object
   */
  const change_corner_radius = React.useCallback(
    (next_corner_radius: number) => {
      if (active_object) {
        modify_object(active_object, {
          rx: next_corner_radius,
          ry: next_corner_radius
        });
      }
    },
    [active_object]
  );

  return (
    <Input
      aria-label={"Layer corner radius"}
      decorator={<CornerRadiusIcon />}
      defaultValue={Math.max(
        (active_object as Rect).rx,
        (active_object as Rect).ry
      )}
      min={0}
      monospaced
      onChange={(event): void => {
        const value = Number.parseInt(event.target.value, 10) ?? 0;
        change_corner_radius(clamp(0, value, Infinity));
      }}
      placeholder={"Corner radius"}
      size={"sm"}
      title={"Corner radius"}
      type={"number"}
    />
  );
};

const ObjectProps = ({
  disable_corner_radius
}: {
  disable_corner_radius?: boolean;
}): React.ReactElement | null => {
  const active_object = use_active_object();

  if (!active_object) {
    return null;
  }

  return (
    <DrawItem key={active_object.get("id")}>
      <DrawItemRow>
        <AngleControl active_object={active_object} />
        {!disable_corner_radius && (
          <CornerRadiusControl active_object={active_object} />
        )}
      </DrawItemRow>
    </DrawItem>
  );
};

export default ObjectProps;
