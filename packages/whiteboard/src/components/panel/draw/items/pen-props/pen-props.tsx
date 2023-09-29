import { clsx } from "clsx";
import { BaseFabricObject, Canvas } from "fabric";
import React from "react";

import Input from "../../../../../../../ui/src/components/input";
import Option from "../../../../../../../ui/src/components/option";
import Select from "../../../../../../../ui/src/components/select";
import ColorPicker, {
  hex_to_rgb,
  str_to_color,
  TColor
} from "../../../../../../../ui/src/entities/color-picker";
import RulerMeasureIcon from "../../../../../../../ui/src/icons/ruler-measure";
import {
  CURSORS,
  MAX_OPACITY,
  MIN_OPACITY,
  PenStyle
} from "../../../../../constants";
import { use_active_object, use_canvas } from "../../../../../hooks";
import { modify_object } from "../../../../../utils";
import DrawItem, { DrawItemRow } from "../../item";
import common_styles from "../common.module.scss";

const DEFAULT_PEN_FILL = "rgba(0,0,0,1)";

// Pen fill color

const PenFillControl = ({
  active_object,
  canvas
}: {
  active_object?: BaseFabricObject;
  canvas: Canvas;
}): React.ReactElement => {
  const [fill, set_fill] = React.useState<TColor>(
    str_to_color(
      (active_object?.fill as string) ||
        canvas.freeDrawingBrush?.color ||
        DEFAULT_PEN_FILL
    )!
  );
  const [value, set_value] = React.useState(`#${fill.hex}`);

  /**
   * Mutates the fill color of the object
   */
  const change_fill = React.useCallback(
    (next_fill: TColor) => {
      set_fill(next_fill);

      if (active_object) {
        modify_object(active_object, {
          fill: next_fill.str
        });
      } else if (canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.color = next_fill.str;
        // Update cursor
        canvas.freeDrawingCursor = CURSORS.pen(next_fill.str);
      }
    },
    [active_object, canvas]
  );

  React.useEffect(() => {
    set_value(`#${fill.hex}`);
  }, [fill]);

  React.useEffect(() => {
    set_fill(
      str_to_color(
        (active_object?.fill as string) ||
          canvas.freeDrawingBrush?.color ||
          DEFAULT_PEN_FILL
      )!
    );
  }, [active_object?.fill, canvas.freeDrawingBrush?.color]);

  return (
    <DrawItemRow>
      <Input
        aria-label={"Pen fill"}
        decorator={
          <ColorPicker default_value={fill} on_change={change_fill}>
            <button
              aria-label={"Pick a color"}
              className={clsx(
                "focusable",
                "focus-invert",
                common_styles.indicator
              )}
              style={
                {
                  "--color": fill.str
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
            change_fill(next_color);
          }
        }}
        placeholder={"Fill"}
        size={"sm"}
        slot_props={{
          container: {
            style: { flex: "0.6" }
          }
        }}
        title={"Fill"}
        value={value}
      />
      <Input
        aria-label={"Pen fill opacity"}
        max={MAX_OPACITY}
        min={MIN_OPACITY}
        monospaced
        onChange={(event): void => {
          const a = Number.parseInt(event.target.value) || 0;
          const { r, g, b } = hex_to_rgb(fill.hex);

          change_fill({
            ...fill,
            str: `rgba(${r},${g},${b},${a / 100})`,
            a
          });
        }}
        placeholder={"Fill opacity"}
        size={"sm"}
        slot_props={{
          container: {
            style: {
              flex: "0.4"
            }
          }
        }}
        title={"Fill opacity"}
        type={"number"}
        value={Math.round(fill.a)}
      />
    </DrawItemRow>
  );
};

// Pen width

const PenWidthControl = ({
  active_object,
  canvas
}: {
  active_object?: BaseFabricObject;
  canvas: Canvas;
}): React.ReactElement => {
  /**
   * Mutates the width of the object
   */
  const change_width = React.useCallback(
    (next_width: number) => {
      if (active_object) {
        modify_object(active_object, {
          penWidth: next_width
        });
      } else if (canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.width = next_width;
      }
    },
    [active_object, canvas.freeDrawingBrush]
  );

  return (
    <Input
      aria-label={"Pen width"}
      decorator={<RulerMeasureIcon />}
      defaultValue={
        active_object?.get("penWidth") ?? canvas.freeDrawingBrush?.width ?? 1
      }
      min={1}
      monospaced
      onChange={(event): void => {
        change_width(Number.parseInt(event.target.value, 10) ?? 1);
      }}
      placeholder={"Pen width"}
      size={"sm"}
      title={"Pen width"}
      type={"number"}
    />
  );
};

// Pen style

const PenStyleControl = ({
  active_object,
  canvas
}: {
  active_object?: BaseFabricObject;
  canvas: Canvas;
}): React.ReactElement => {
  const [pen_style, set_pen_style] = React.useState<PenStyle>(
    active_object?.get("penStyle") ||
      (canvas.freeDrawingBrush as any)?.penStyle ||
      PenStyle.PRESSURE
  );

  /**
   * Mutates the pen style of the object
   */
  const change_pen_style = React.useCallback(
    (next_pen_style: PenStyle) => {
      set_pen_style(next_pen_style);

      if (active_object) {
        modify_object(active_object, {
          penStyle: next_pen_style
        });
      } else if (canvas.freeDrawingBrush) {
        (canvas.freeDrawingBrush as any).penStyle = next_pen_style;
      }
    },
    [active_object, canvas.freeDrawingBrush]
  );

  React.useEffect(() => {
    set_pen_style(
      active_object?.get("penStyle") ||
        (canvas.freeDrawingBrush as any)?.penStyle ||
        PenStyle.PRESSURE
    );
  }, [active_object, canvas.freeDrawingBrush]);

  return (
    <Select
      onValueChange={(newValue: PenStyle): void => change_pen_style(newValue)}
      size={"sm"}
      slot_props={{
        content: {
          style: {
            zIndex: "calc(var(--z-index-modal) + 2)"
          }
        },
        trigger: {
          className: clsx("full-w")
        }
      }}
      value={pen_style}
    >
      <Option value={PenStyle.PRESSURE}>Pressure</Option>
      <Option value={PenStyle.NORMAL}>Normal</Option>
    </Select>
  );
};

const PenProps = (): React.ReactElement | null => {
  const canvas = use_canvas();
  const active_object = use_active_object();

  if (!canvas.current) {
    return null;
  }

  return (
    <DrawItem key={active_object?.get("id")} label={"Pen"}>
      <DrawItemRow>
        <PenStyleControl
          active_object={active_object || undefined}
          canvas={canvas.current}
        />
      </DrawItemRow>
      <PenFillControl
        active_object={active_object || undefined}
        canvas={canvas.current}
      />
      <DrawItemRow>
        <PenWidthControl
          active_object={active_object || undefined}
          canvas={canvas.current}
        />
      </DrawItemRow>
    </DrawItem>
  );
};

export default PenProps;
