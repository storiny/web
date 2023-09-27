import { clsx } from "clsx";
import { Canvas } from "fabric";
import React from "react";

import Divider from "~/components/Divider";
import Input from "~/components/Input";
import Spacer from "~/components/Spacer";
import ToggleGroup from "~/components/ToggleGroup";
import ToggleGroupItem from "~/components/ToggleGroupItem";
import ColorPicker, {
  hexToRgb,
  strToColor,
  TColor
} from "~/entities/ColorPicker";

import {
  DEFAULT_CANVAS_FILL,
  MAX_OPACITY,
  MIN_OPACITY,
  SWATCH
} from "../../../constants";
import { useCanvas } from "../../../hooks";
import DrawItem, { DrawItemRow } from "../draw/item";
import commonStyles from "../draw/items/common.module.scss";
import styles from "./canvas.module.scss";

/**
 * Converts HEX to RGBA string
 * @param hex Hex string
 * @param a Alpha value
 */
const hexToRgbaString = (hex: string, a: number): string => {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a / 100})`;
};

// Canvas fill

const FillControl = ({ canvas }: { canvas: Canvas }): React.ReactElement => {
  const [fill, setFill] = React.useState<TColor>(
    strToColor((canvas.backgroundColor as string) || DEFAULT_CANVAS_FILL)!
  );
  const [value, setValue] = React.useState(`#${fill.hex}`);

  /**
   * Mutates the fill of the canvas
   */
  const changeFill = React.useCallback(
    (newFill: TColor) => {
      setFill(newFill);
      canvas.backgroundColor = newFill.str;
      canvas.requestRenderAll();
    },
    [canvas]
  );

  React.useEffect(() => {
    setValue(`#${fill.hex}`);
  }, [fill]);

  React.useEffect(() => {
    setFill(
      strToColor((canvas.backgroundColor as string) || DEFAULT_CANVAS_FILL)!
    );
  }, [canvas.backgroundColor]);

  return (
    <React.Fragment>
      <DrawItemRow>
        <Input
          aria-label={"Canvas fill"}
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
                  commonStyles.indicator
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
            const newColor = strToColor(event.target.value);

            if (newColor) {
              changeFill(newColor);
            }
          }}
          placeholder={"Fill"}
          size={"sm"}
          slot_props={{
            container: {
              style: {
                flex: "0.6"
              }
            }
          }}
          title={"Fill"}
          value={value}
        />
        <Input
          aria-label={"Canvas fill opacity"}
          max={MAX_OPACITY}
          min={MIN_OPACITY}
          monospaced
          onChange={(event): void => {
            const a = Number.parseInt(event.target.value) || 0;
            const { r, g, b } = hexToRgb(fill.hex);

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
      <DrawItemRow>
        <ToggleGroup
          className={"f-grow"}
          onValueChange={(newValue: string): void => {
            const newColor = SWATCH[newValue as keyof typeof SWATCH];
            if (newColor) {
              changeFill(strToColor(newColor || DEFAULT_CANVAS_FILL)!);
            }
          }}
          size={"xs"}
          style={{ gap: "8px" }}
          value={
            hexToRgbaString(fill.hex, fill.a) === SWATCH.dark
              ? "dark"
              : hexToRgbaString(fill.hex, fill.a) === SWATCH.light
              ? "light"
              : fill.a === 0
              ? "transparent"
              : undefined
          }
        >
          <ToggleGroupItem
            aria-label={"Dark fill"}
            className={clsx(styles.x, styles.swatch)}
            slot_props={{
              container: { className: "f-grow" }
            }}
            style={{ "--color": SWATCH.dark } as React.CSSProperties}
            tooltipContent={"Dark"}
            value={"dark"}
          />
          <ToggleGroupItem
            aria-label={"Light fill"}
            className={clsx(styles.x, styles.swatch)}
            slot_props={{
              container: { className: "f-grow" }
            }}
            style={{ "--color": SWATCH.light } as React.CSSProperties}
            tooltipContent={"Light"}
            value={"light"}
          />
          <ToggleGroupItem
            aria-label={"Transparent fill"}
            className={clsx(styles.x, styles.swatch, styles.transparent)}
            slot_props={{
              container: { className: "f-grow" }
            }}
            style={{ "--color": SWATCH.transparent } as React.CSSProperties}
            tooltipContent={"Transparent"}
            value={"transparent"}
          />
        </ToggleGroup>
      </DrawItemRow>
    </React.Fragment>
  );
};

const CanvasTools = (): React.ReactElement | null => {
  const canvas = useCanvas();

  if (!canvas.current) {
    return null;
  }

  return (
    <React.Fragment>
      <Spacer orientation={"vertical"} size={1.5} />
      <DrawItem label={"Canvas"}>
        <FillControl canvas={canvas.current} />
      </DrawItem>
      <Spacer orientation={"vertical"} size={2} />
      <Divider />
    </React.Fragment>
  );
};

export default CanvasTools;
