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
import RulerMeasureIcon from "~/icons/RulerMeasure";

import {
  CURSORS,
  MAX_OPACITY,
  MIN_OPACITY,
  PenStyle
} from "../../../../../constants";
import { useActiveObject, useCanvas } from "../../../../../hooks";
import { modifyObject } from "../../../../../utils";
import DrawItem, { DrawItemRow } from "../../item";
import common_styles from "../common.module.scss";

const DEFAULT_PEN_FILL = "rgba(0,0,0,1)";

// Pen fill color

const PenFillControl = ({
  activeObject,
  canvas
}: {
  activeObject?: BaseFabricObject;
  canvas: Canvas;
}): React.ReactElement => {
  const [fill, setFill] = React.useState<TColor>(
    str_to_color(
      (activeObject?.fill as string) ||
        canvas.freeDrawingBrush?.color ||
        DEFAULT_PEN_FILL
    )!
  );
  const [value, setValue] = React.useState(`#${fill.hex}`);

  /**
   * Mutates the fill color of the object
   */
  const changeFill = React.useCallback(
    (newFill: TColor) => {
      setFill(newFill);

      if (activeObject) {
        modifyObject(activeObject, {
          fill: newFill.str
        });
      } else if (canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.color = newFill.str;
        // Update cursor
        canvas.freeDrawingCursor = CURSORS.pen(newFill.str);
      }
    },
    [activeObject, canvas]
  );

  React.useEffect(() => {
    setValue(`#${fill.hex}`);
  }, [fill]);

  React.useEffect(() => {
    setFill(
      str_to_color(
        (activeObject?.fill as string) ||
          canvas.freeDrawingBrush?.color ||
          DEFAULT_PEN_FILL
      )!
    );
  }, [activeObject?.fill, canvas.freeDrawingBrush?.color]);

  return (
    <DrawItemRow>
      <Input
        aria-label={"Pen fill"}
        decorator={
          <ColorPicker
            defaultValue={fill}
            onChange={(value): void => changeFill(value)}
          >
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
          setValue(event.target.value);
          const newColor = str_to_color(event.target.value);

          if (newColor) {
            changeFill(newColor);
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

          changeFill({
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
  activeObject,
  canvas
}: {
  activeObject?: BaseFabricObject;
  canvas: Canvas;
}): React.ReactElement => {
  /**
   * Mutates the width of the object
   */
  const changeWidth = React.useCallback(
    (width: number) => {
      if (activeObject) {
        modifyObject(activeObject, {
          penWidth: width
        });
      } else if (canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.width = width;
      }
    },
    [activeObject, canvas.freeDrawingBrush]
  );

  return (
    <Input
      aria-label={"Pen width"}
      decorator={<RulerMeasureIcon />}
      defaultValue={
        activeObject?.get("penWidth") ?? canvas.freeDrawingBrush?.width ?? 1
      }
      min={1}
      monospaced
      onChange={(event): void => {
        changeWidth(Number.parseInt(event.target.value, 10) ?? 1);
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
  activeObject,
  canvas
}: {
  activeObject?: BaseFabricObject;
  canvas: Canvas;
}): React.ReactElement => {
  const [penStyle, setPenStyle] = React.useState<PenStyle>(
    activeObject?.get("penStyle") ||
      (canvas.freeDrawingBrush as any)?.penStyle ||
      PenStyle.PRESSURE
  );

  /**
   * Mutates the pen style of the object
   */
  const changePenStyle = React.useCallback(
    (newPenStyle: PenStyle) => {
      setPenStyle(newPenStyle);

      if (activeObject) {
        modifyObject(activeObject, {
          penStyle: newPenStyle
        });
      } else if (canvas.freeDrawingBrush) {
        (canvas.freeDrawingBrush as any).penStyle = newPenStyle;
      }
    },
    [activeObject, canvas.freeDrawingBrush]
  );

  React.useEffect(() => {
    setPenStyle(
      activeObject?.get("penStyle") ||
        (canvas.freeDrawingBrush as any)?.penStyle ||
        PenStyle.PRESSURE
    );
  }, [activeObject, canvas.freeDrawingBrush]);

  return (
    <Select
      onValueChange={(newValue: PenStyle): void => changePenStyle(newValue)}
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
      value={penStyle}
    >
      <Option value={PenStyle.PRESSURE}>Pressure</Option>
      <Option value={PenStyle.NORMAL}>Normal</Option>
    </Select>
  );
};

const PenProps = (): React.ReactElement | null => {
  const canvas = useCanvas();
  const activeObject = useActiveObject();

  if (!canvas.current) {
    return null;
  }

  return (
    <DrawItem key={activeObject?.get("id")} label={"Pen"}>
      <DrawItemRow>
        <PenStyleControl
          activeObject={activeObject || undefined}
          canvas={canvas.current}
        />
      </DrawItemRow>
      <PenFillControl
        activeObject={activeObject || undefined}
        canvas={canvas.current}
      />
      <DrawItemRow>
        <PenWidthControl
          activeObject={activeObject || undefined}
          canvas={canvas.current}
        />
      </DrawItemRow>
    </DrawItem>
  );
};

export default PenProps;
