import { clsx } from "clsx";
import { Canvas } from "fabric";
import React from "react";

import Divider from "~/components/divider";
import Input from "~/components/input";
import Spacer from "~/components/spacer";
import ToggleGroup from "~/components/toggle-group";
import ToggleGroupItem from "~/components/toggle-group-item";
import ColorPicker, {
  hex_to_rgb,
  str_to_color,
  TColor
} from "~/entities/color-picker";
import css from "~/theme/main.module.scss";

import {
  DEFAULT_CANVAS_FILL,
  MAX_OPACITY,
  MIN_OPACITY,
  SWATCH
} from "../../../constants";
import { use_canvas } from "../../../hooks";
import DrawItem, { DrawItemRow } from "../draw/item";
import common_styles from "../draw/items/common.module.scss";
import styles from "./canvas.module.scss";

/**
 * Converts HEX to RGBA string
 * @param hex Hex string
 * @param a Alpha value
 */
const hex_to_rgba_string = (hex: string, a: number): string => {
  const { r, g, b } = hex_to_rgb(hex);
  return `rgba(${r},${g},${b},${a / 100})`;
};

// Canvas fill

const FillControl = ({ canvas }: { canvas: Canvas }): React.ReactElement => {
  const [fill, set_fill] = React.useState<TColor>(
    str_to_color((canvas.backgroundColor as string) || DEFAULT_CANVAS_FILL)!
  );
  const [value, set_value] = React.useState(`#${fill.hex}`);

  /**
   * Mutates the fill of the canvas
   */
  const change_fill = React.useCallback(
    (next_fill: TColor) => {
      set_fill(next_fill);
      canvas.backgroundColor = next_fill.str;
      canvas.requestRenderAll();
    },
    [canvas]
  );

  React.useEffect(() => {
    set_value(`#${fill.hex}`);
  }, [fill]);

  React.useEffect(() => {
    set_fill(
      str_to_color((canvas.backgroundColor as string) || DEFAULT_CANVAS_FILL)!
    );
  }, [canvas.backgroundColor]);

  return (
    <React.Fragment>
      <DrawItemRow>
        <Input
          aria-label={"Canvas fill"}
          decorator={
            <ColorPicker default_value={fill} on_change={change_fill}>
              <button
                aria-label={"Pick a color"}
                className={clsx(
                  css["focusable"],
                  css["focus-invert"],
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
      <DrawItemRow>
        <ToggleGroup
          className={css["f-grow"]}
          onValueChange={(next_value: string): void => {
            const next_color = SWATCH[next_value as keyof typeof SWATCH];
            if (next_color) {
              change_fill(str_to_color(next_color || DEFAULT_CANVAS_FILL)!);
            }
          }}
          size={"xs"}
          style={{ gap: "8px" }}
          value={
            hex_to_rgba_string(fill.hex, fill.a) === SWATCH.dark
              ? "dark"
              : hex_to_rgba_string(fill.hex, fill.a) === SWATCH.light
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
              container: { className: css["f-grow"] }
            }}
            style={{ "--color": SWATCH.dark } as React.CSSProperties}
            tooltip_content={"Dark"}
            value={"dark"}
          />
          <ToggleGroupItem
            aria-label={"Light fill"}
            className={clsx(styles.x, styles.swatch)}
            slot_props={{
              container: { className: css["f-grow"] }
            }}
            style={{ "--color": SWATCH.light } as React.CSSProperties}
            tooltip_content={"Light"}
            value={"light"}
          />
          <ToggleGroupItem
            aria-label={"Transparent fill"}
            className={clsx(styles.x, styles.swatch, styles.transparent)}
            slot_props={{
              container: { className: css["f-grow"] }
            }}
            style={{ "--color": SWATCH.transparent } as React.CSSProperties}
            tooltip_content={"Transparent"}
            value={"transparent"}
          />
        </ToggleGroup>
      </DrawItemRow>
    </React.Fragment>
  );
};

const CanvasTools = (): React.ReactElement | null => {
  const canvas = use_canvas();

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
