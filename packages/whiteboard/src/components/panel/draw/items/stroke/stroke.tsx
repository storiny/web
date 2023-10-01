import { clsx } from "clsx";
import { BaseFabricObject } from "fabric";
import React from "react";

import IconButton from "~/components/icon-button";
import Input from "~/components/input";
import Option from "~/components/option";
import Select from "~/components/select";
import Tooltip from "~/components/tooltip";
import ColorPicker, {
  hex_to_rgb,
  str_to_color,
  TColor
} from "~/entities/color-picker";
import ArrowheadArrowIcon from "~/icons/arrowhead-arrow";
import ArrowheadArrowLongIcon from "~/icons/arrowhead-arrow-long";
import ArrowheadBarIcon from "~/icons/arrowhead-bar";
import ArrowheadBarLongIcon from "~/icons/arrowhead-bar-long";
import ArrowheadDotIcon from "~/icons/arrowhead-dot";
import ArrowheadDotLongIcon from "~/icons/arrowhead-dot-long";
import ArrowheadNoneIcon from "~/icons/arrowhead-none";
import ArrowheadNoneLongIcon from "~/icons/arrowhead-none-long";
import ArrowheadTriangleIcon from "~/icons/arrowhead-triangle";
import ArrowheadTriangleLongIcon from "~/icons/arrowhead-triangle-long";
import LineDashedIcon from "~/icons/line-dashed";
import LineDottedIcon from "~/icons/line-dotted";
import LineSolidIcon from "~/icons/line-solid";
import RulerMeasureIcon from "~/icons/ruler-measure";
import SwapIcon from "~/icons/swap";
import css from "~/theme/main.module.scss";

import {
  Arrowhead,
  MAX_OPACITY,
  MIN_OPACITY,
  StrokeStyle
} from "../../../../../constants";
import { use_active_object } from "../../../../../hooks";
import { is_arrow_object, modify_object } from "../../../../../utils";
import DrawItem, { DrawItemRow } from "../../item";
import common_styles from "../common.module.scss";
import styles from "./stroke.module.scss";

const DEFAULT_LAYER_STROKE = "rgba(0,0,0,0)";

/**
 * Returns the arrowhead icon
 * @param arrowhead Arrowhead
 * @param position Arrowhead position
 */
const get_arrowhead_icon = (
  arrowhead: Arrowhead,
  position: "start" | "end"
): React.ReactNode => {
  const rotation = position === "start" ? 0 : 180;
  return (
    {
      [Arrowhead.NONE]: <ArrowheadNoneLongIcon rotation={rotation} />,
      [Arrowhead.ARROW]: <ArrowheadArrowLongIcon rotation={rotation} />,
      [Arrowhead.DOT]: <ArrowheadDotLongIcon rotation={rotation} />,
      [Arrowhead.BAR]: <ArrowheadBarLongIcon rotation={rotation} />,
      [Arrowhead.TRIANGLE]: <ArrowheadTriangleLongIcon rotation={rotation} />
    } as Record<Arrowhead, React.ReactNode>
  )[arrowhead];
};

// Stroke color

const StrokeControl = ({
  active_object
}: {
  active_object: BaseFabricObject;
}): React.ReactElement => {
  const [stroke, set_stroke] = React.useState<TColor>(
    str_to_color((active_object.stroke as string) || DEFAULT_LAYER_STROKE)!
  );
  const [value, set_value] = React.useState(`#${stroke.hex}`);

  /**
   * Mutates the stroke color of the object
   */
  const change_stroke = React.useCallback(
    (next_stroke: TColor) => {
      set_stroke(next_stroke);

      if (active_object) {
        modify_object(active_object, {
          stroke: next_stroke.str
        });
      }
    },
    [active_object]
  );

  React.useEffect(() => {
    set_value(`#${stroke.hex}`);
  }, [stroke]);

  React.useEffect(() => {
    set_stroke(
      str_to_color((active_object?.stroke as string) || DEFAULT_LAYER_STROKE)!
    );
  }, [active_object?.stroke]);

  return (
    <DrawItemRow>
      <Input
        aria-label={"Layer stroke"}
        decorator={
          <ColorPicker default_value={stroke} on_change={change_stroke}>
            <button
              aria-label={"Pick a color"}
              className={clsx(
                css["focusable"],
                css["focus-invert"],
                common_styles.indicator
              )}
              style={
                {
                  "--color": stroke.str
                } as React.CSSProperties
              }
              title={"Pick a color"}
            />
          </ColorPicker>
        }
        monospaced
        onChange={(event): void => {
          set_value(event.target.value);
          const next_color = str_to_color(event.target.value);
          if (next_color) {
            change_stroke(next_color);
          }
        }}
        placeholder={"Stroke"}
        size={"sm"}
        slot_props={{
          container: {
            style: { flex: "0.6" }
          }
        }}
        title={"Stroke"}
        value={value}
      />
      <Input
        aria-label={"Layer stroke opacity"}
        max={MAX_OPACITY}
        min={MIN_OPACITY}
        monospaced
        onChange={(event): void => {
          const a = Number.parseInt(event.target.value) || 0;
          const { r, g, b } = hex_to_rgb(stroke.hex);

          change_stroke({
            ...stroke,
            str: `rgba(${r},${g},${b},${a / 100})`,
            a
          });
        }}
        placeholder={"Stroke opacity"}
        size={"sm"}
        slot_props={{
          container: {
            style: {
              flex: "0.4"
            }
          }
        }}
        title={"Stroke opacity"}
        type={"number"}
        value={Math.round(stroke.a)}
      />
    </DrawItemRow>
  );
};

// Stroke width

const StrokeWidthControl = ({
  active_object,
  disable_stroke_style
}: {
  active_object: BaseFabricObject;
  disable_stroke_style: boolean;
}): React.ReactElement => {
  /**
   * Mutates the stroke width of the object
   */
  const change_stroke_width = React.useCallback(
    (next_stroke_width: number) => {
      if (active_object) {
        modify_object(active_object, {
          strokeWidth: next_stroke_width
        });
      }
    },
    [active_object]
  );

  return (
    <Input
      aria-label={"Layer stroke width"}
      decorator={<RulerMeasureIcon />}
      defaultValue={active_object.strokeWidth ?? 0}
      min={0}
      monospaced
      onChange={(event): void => {
        change_stroke_width(Number.parseInt(event.target.value, 10) ?? 0);
      }}
      placeholder={"Stroke width"}
      size={"sm"}
      slot_props={{
        container: {
          style: {
            flex: disable_stroke_style ? "1" : "0.4"
          }
        }
      }}
      title={"Stroke width"}
      type={"number"}
    />
  );
};

// Stroke style

const StrokeStyleControl = ({
  active_object
}: {
  active_object: BaseFabricObject;
}): React.ReactElement => {
  const [stroke_style, set_stroke_style] = React.useState<StrokeStyle>(
    active_object.get("strokeStyle") || StrokeStyle.SOLID
  );

  /**
   * Mutates the stroke style of the object
   */
  const change_stroke_style = React.useCallback(
    (next_stroke_style: StrokeStyle) => {
      set_stroke_style(next_stroke_style);

      if (active_object) {
        modify_object(active_object, {
          strokeStyle: next_stroke_style
        });
      }
    },
    [active_object]
  );

  React.useEffect(() => {
    set_stroke_style(active_object.get("strokeStyle") || StrokeStyle.SOLID);
  }, [active_object]);

  return (
    <Select
      onValueChange={(next_value): void =>
        change_stroke_style(next_value as StrokeStyle)
      }
      size={"sm"}
      slot_props={{
        content: {
          style: {
            zIndex: "calc(var(--z-index-modal) + 2)"
          }
        },
        trigger: {
          className: css["full-w"],
          style: { flex: "0.6" }
        }
      }}
      value={stroke_style}
    >
      <Option decorator={<LineSolidIcon />} value={StrokeStyle.SOLID}>
        Solid
      </Option>
      <Option decorator={<LineDashedIcon />} value={StrokeStyle.DASHED}>
        Dashed
      </Option>
      <Option decorator={<LineDottedIcon />} value={StrokeStyle.DOTTED}>
        Dotted
      </Option>
    </Select>
  );
};

// Arrowhead style

const ArrowheadControl = ({
  active_object
}: {
  active_object: BaseFabricObject;
}): React.ReactElement => {
  const [start_arrowhead, set_start_arrowhead] = React.useState<Arrowhead>(
    active_object.get("startArrowhead") || Arrowhead.NONE
  );
  const [end_arrowhead, set_end_arrowhead] = React.useState<Arrowhead>(
    active_object.get("endArrowhead") || Arrowhead.ARROW
  );

  /**
   * Mutates the arrowhead of the object
   */
  const change_arrowhead = React.useCallback(
    (next_arrowhead: Arrowhead, position: "start" | "end") => {
      (position === "start" ? set_start_arrowhead : set_end_arrowhead)(
        next_arrowhead
      );

      if (active_object) {
        modify_object(active_object, {
          [position === "start" ? "startArrowhead" : "endArrowhead"]:
            next_arrowhead
        });
      }
    },
    [active_object]
  );

  /**
   * Swaps the start and end arrowheads
   */
  const swap_arrowheads = React.useCallback(() => {
    const current_start_arrowhead = start_arrowhead;
    set_start_arrowhead(end_arrowhead);
    set_end_arrowhead(current_start_arrowhead);

    if (active_object) {
      modify_object(active_object, {
        startArrowhead: end_arrowhead,
        endArrowhead: current_start_arrowhead
      });
    }
  }, [active_object, end_arrowhead, start_arrowhead]);

  React.useEffect(() => {
    set_start_arrowhead(active_object.get("startArrowhead") || Arrowhead.NONE);
    set_end_arrowhead(active_object.get("endArrowhead") || Arrowhead.ARROW);
  }, [active_object]);

  return (
    <DrawItemRow>
      <Select
        onValueChange={(next_value): void =>
          change_arrowhead(next_value as Arrowhead, "start")
        }
        size={"sm"}
        slot_props={{
          content: {
            style: {
              zIndex: "calc(var(--z-index-modal) + 2)"
            }
          },
          trigger: {
            className: css["full-w"]
          }
        }}
        value={start_arrowhead}
        value_children={
          <span className={clsx(css["flex-center"], styles["arrowhead-value"])}>
            {get_arrowhead_icon(start_arrowhead, "start")}
          </span>
        }
      >
        <Option decorator={<ArrowheadNoneIcon />} value={Arrowhead.NONE}>
          None
        </Option>
        <Option decorator={<ArrowheadArrowIcon />} value={Arrowhead.ARROW}>
          Arrow
        </Option>
        <Option
          decorator={<ArrowheadTriangleIcon />}
          value={Arrowhead.TRIANGLE}
        >
          Triangle
        </Option>
        <Option decorator={<ArrowheadDotIcon />} value={Arrowhead.DOT}>
          Dot
        </Option>
        <Option decorator={<ArrowheadBarIcon />} value={Arrowhead.BAR}>
          Bar
        </Option>
      </Select>
      <Tooltip content={"Swap arrowheads"}>
        <IconButton
          onClick={swap_arrowheads}
          size={"sm"}
          style={{ "--size": "24px" } as React.CSSProperties}
          variant={"ghost"}
        >
          <SwapIcon />
        </IconButton>
      </Tooltip>
      <Select
        onValueChange={(next_value): void =>
          change_arrowhead(next_value as Arrowhead, "end")
        }
        size={"sm"}
        slot_props={{
          content: {
            style: {
              zIndex: "calc(var(--z-index-modal) + 2)"
            }
          },
          trigger: {
            className: css["full-w"]
          }
        }}
        value={end_arrowhead}
        value_children={
          <span className={clsx(css["flex-center"], styles["arrowhead-value"])}>
            {get_arrowhead_icon(end_arrowhead, "end")}
          </span>
        }
      >
        <Option decorator={<ArrowheadNoneIcon />} value={Arrowhead.NONE}>
          None
        </Option>
        <Option decorator={<ArrowheadArrowIcon />} value={Arrowhead.ARROW}>
          Arrow
        </Option>
        <Option
          decorator={<ArrowheadTriangleIcon />}
          value={Arrowhead.TRIANGLE}
        >
          Triangle
        </Option>
        <Option decorator={<ArrowheadDotIcon />} value={Arrowhead.DOT}>
          Dot
        </Option>
        <Option decorator={<ArrowheadBarIcon />} value={Arrowhead.BAR}>
          Bar
        </Option>
      </Select>
    </DrawItemRow>
  );
};

const Stroke = ({
  disable_stroke_style
}: {
  disable_stroke_style?: boolean;
}): React.ReactElement | null => {
  const active_object = use_active_object();

  if (!active_object) {
    return null;
  }

  return (
    <DrawItem key={active_object.get("id")} label={"Stroke"}>
      <StrokeControl active_object={active_object} />
      <DrawItemRow>
        {!disable_stroke_style && (
          <StrokeStyleControl active_object={active_object} />
        )}
        <StrokeWidthControl
          active_object={active_object}
          disable_stroke_style={Boolean(disable_stroke_style)}
        />
      </DrawItemRow>
      {is_arrow_object(active_object) && (
        <ArrowheadControl active_object={active_object} />
      )}
    </DrawItem>
  );
};

export default Stroke;
