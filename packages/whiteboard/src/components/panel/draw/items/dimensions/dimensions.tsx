import React from "react";

import { clamp } from "~/utils/clamp";

import Input from "../../../../../../../ui/src/components/input";
import Toggle from "../../../../../../../ui/src/components/toggle";
import ConstrainedIcon from "../../../../../../../ui/src/icons/constrained";
import LetterHIcon from "../../../../../../../ui/src/icons/letter-h";
import LetterWIcon from "../../../../../../../ui/src/icons/letter-w";
import UnconstrainedIcon from "../../../../../../../ui/src/icons/unconstrained";
import { MAX_LAYER_SIZE, MIN_LAYER_SIZE } from "../../../../../constants";
import {
  use_active_object,
  use_canvas,
  use_event_render
} from "../../../../../hooks";
import { is_scalable_object, modify_object } from "../../../../../utils";
import DrawItem, { DrawItemRow } from "../../item";

const Dimensions = (): React.ReactElement | null => {
  const active_object = use_active_object();
  const canvas = use_canvas();
  const [constrained, set_constrained] = React.useState<boolean>(
    Boolean(canvas.current?.uniformScaling)
  );
  const [dimensions, set_dimensions] = React.useState<{
    height: number;
    width: number;
  }>({
    height: 0,
    width: 0
  });

  use_event_render("object:scaling", (options) => {
    const object = options.target;
    return object.get("id") === active_object?.get("id");
  });
  use_event_render("draw:scaling" as any, (options) => {
    const object = options.target;
    return object.get("id") === active_object?.get("id");
  });
  use_event_render("draw:end" as any, (options) => {
    const object = options.target;
    return object.get("id") === active_object?.get("id");
  });
  use_event_render("linear:moving" as any, (options) => {
    const object = options.target;
    return object.get("id") === active_object?.get("id");
  });

  /**
   * Mutates the height of the object
   */
  const change_height = React.useCallback(
    (next_height: number) => {
      set_dimensions((prev_state) => ({ ...prev_state, height: next_height }));

      if (active_object) {
        const clamped_height = clamp(1, next_height, Infinity);

        if (is_scalable_object(active_object)) {
          if (constrained) {
            active_object.scaleToHeight(clamped_height); // Scale both X and Y equally
            canvas.current?.requestRenderAll();
          } else {
            const bounding_rect_factor =
              active_object.getBoundingRect().height /
              active_object.getScaledHeight();

            modify_object(active_object, {
              scaleY:
                clamped_height / active_object.height / bounding_rect_factor
            });
          }
        } else {
          const delta = next_height - active_object.height;

          modify_object(active_object, {
            height: clamped_height
          });

          if (constrained) {
            modify_object(active_object, {
              width: clamp(1, active_object.width + delta, Infinity)
            });
          }
        }
      }
    },
    [active_object, canvas, constrained]
  );

  /**
   * Mutates the width of the object
   */
  const change_width = React.useCallback(
    (next_width: number) => {
      set_dimensions((prev_state) => ({ ...prev_state, width: next_width }));

      if (active_object) {
        const clamped_width = clamp(1, next_width, Infinity);

        if (is_scalable_object(active_object)) {
          if (constrained) {
            active_object.scaleToWidth(clamped_width); // Scale both X and Y equally
            canvas.current?.requestRenderAll();
          } else {
            const bounding_rect_factor =
              active_object.getBoundingRect().width /
              active_object.getScaledWidth();

            modify_object(active_object, {
              scaleX: clamped_width / active_object.width / bounding_rect_factor
            });
          }
        } else {
          const delta = next_width - active_object.width;

          modify_object(active_object, {
            width: clamped_width
          });

          if (constrained) {
            modify_object(active_object, {
              height: clamp(1, active_object.height + delta, Infinity)
            });
          }
        }
      }
    },
    [active_object, canvas, constrained]
  );

  /**
   * Mutates the constrained dimensions of the object
   */
  const change_constrained = React.useCallback(
    (next_constrained: boolean) => {
      set_constrained(next_constrained);

      if (canvas.current) {
        canvas.current.uniformScaling = next_constrained;
      }
    },
    [canvas]
  );

  React.useEffect(() => {
    set_dimensions({
      height: (active_object?.height || 0) * (active_object?.scaleY || 0) || 1,
      width: (active_object?.width || 0) * (active_object?.scaleX || 0) || 1
    });
  }, [
    active_object?.height,
    active_object?.scaleX,
    active_object?.scaleY,
    active_object?.width
  ]);

  if (!active_object) {
    return null;
  }

  return (
    <DrawItem key={active_object.get("id")}>
      <DrawItemRow>
        <Input
          aria-label={"Layer width"}
          decorator={<LetterWIcon />}
          max={MAX_LAYER_SIZE}
          min={MIN_LAYER_SIZE}
          monospaced
          onChange={(event): void =>
            change_width(Number.parseFloat(event.target.value) || 1)
          }
          placeholder={"Width"}
          size={"sm"}
          title={"Width"}
          type={"number"}
          value={Math.round(dimensions.width)}
        />
        <Input
          aria-label={"Layer height"}
          decorator={<LetterHIcon />}
          max={MAX_LAYER_SIZE}
          min={MIN_LAYER_SIZE}
          monospaced
          onChange={(event): void =>
            change_height(Number.parseFloat(event.target.value) || 1)
          }
          placeholder={"Height"}
          size={"sm"}
          title={"Height"}
          type={"number"}
          value={Math.round(dimensions.height)}
        />
        <Toggle
          onPressedChange={change_constrained}
          pressed={constrained}
          size={"sm"}
          style={{ "--size": "24px" } as React.CSSProperties}
          tooltip_content={`${
            constrained ? "Unconstrain" : "Constrain"
          } dimensions`}
        >
          {constrained ? <ConstrainedIcon /> : <UnconstrainedIcon />}
        </Toggle>
      </DrawItemRow>
    </DrawItem>
  );
};

export default Dimensions;
