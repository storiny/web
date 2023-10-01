import { clsx } from "clsx";
import { BaseFabricObject } from "fabric";
import React from "react";

import Input from "~/components/input";
import Option from "~/components/option";
import Select from "~/components/select";
import ColorPicker, {
  hex_to_rgb,
  str_to_color,
  TColor
} from "~/entities/color-picker";
import CrossHatchFillIcon from "~/icons/cross-hatch-fill";
import DashedFillIcon from "~/icons/dashed-fill";
import DottedFillIcon from "~/icons/dotted-fill";
import HachureFillIcon from "~/icons/hachure-fill";
import HachureGapIcon from "~/icons/hachure-gap";
import RulerMeasureIcon from "~/icons/ruler-measure";
import SolidFillIcon from "~/icons/solid-fill";
import ZigzagFillIcon from "~/icons/zigzag-fill";
import ZigzagLineFillIcon from "~/icons/zigzag-line-fill";

import {
  DEFAULT_LAYER_COLOR,
  FillStyle,
  MAX_OPACITY,
  MIN_OPACITY
} from "../../../../../constants";
import { use_active_object } from "../../../../../hooks";
import { modify_object } from "../../../../../utils";
import DrawItem, { DrawItemRow } from "../../item";
import common_styles from "../common.module.scss";

// Fill

const FillControl = ({
  active_object
}: {
  active_object: BaseFabricObject;
}): React.ReactElement => {
  const [fill, set_fill] = React.useState<TColor>(
    str_to_color((active_object?.fill as string) || DEFAULT_LAYER_COLOR)!
  );
  const [value, set_value] = React.useState(`#${fill.hex}`);

  /**
   * Mutates the fill of the object
   */
  const change_fill = React.useCallback(
    (next_fill: TColor) => {
      set_fill(next_fill);

      if (active_object) {
        modify_object(active_object, {
          fill: next_fill.str
        });
      }
    },
    [active_object]
  );

  React.useEffect(() => {
    set_value(`#${fill.hex}`);
  }, [fill]);

  React.useEffect(() => {
    set_fill(
      str_to_color((active_object?.fill as string) || DEFAULT_LAYER_COLOR)!
    );
  }, [active_object?.fill]);

  return (
    <DrawItemRow>
      <Input
        aria-label={"Layer fill"}
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
            style: {
              flex: "0.6"
            }
          }
        }}
        title={"Fill"}
        value={value}
      />
      <Input
        aria-label={"Layer fill opacity"}
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

// Fill style

const FillStyleControl = ({
  active_object
}: {
  active_object: BaseFabricObject;
}): React.ReactElement => {
  const [fill_style, set_fill_style] = React.useState<FillStyle>(
    active_object?.get("fillStyle") || FillStyle.SOLID
  );

  /**
   * Mutates the fill style of the object
   */
  const change_fill_style = React.useCallback(
    (next_fill_style: FillStyle) => {
      set_fill_style(next_fill_style);

      if (active_object) {
        modify_object(active_object, {
          fillStyle: next_fill_style
        });
      }
    },
    [active_object]
  );

  /**
   * Mutates the fill weight of the object
   */
  const change_fill_weight = React.useCallback(
    (next_fill_weight: number) => {
      if (active_object) {
        modify_object(active_object, { fillWeight: next_fill_weight });
      }
    },
    [active_object]
  );

  /**
   * Mutates the hachure gap of the object
   */
  const change_hachure_gap = React.useCallback(
    (next_hachure_gap: number) => {
      if (active_object) {
        modify_object(active_object, { hachureGap: next_hachure_gap });
      }
    },
    [active_object]
  );

  React.useEffect(() => {
    set_fill_style(active_object?.get("fillStyle") || FillStyle.SOLID);
  }, [active_object]);

  return (
    <>
      <DrawItemRow>
        <Select
          onValueChange={(next_value): void =>
            change_fill_style(next_value as FillStyle)
          }
          size={"sm"}
          slot_props={{
            content: {
              style: {
                zIndex: "calc(var(--z-index-modal) + 2)"
              }
            },
            trigger: {
              className: clsx("full-w"),
              style: { flex: "0.6" }
            }
          }}
          value={fill_style}
        >
          <Option decorator={<SolidFillIcon />} value={FillStyle.SOLID}>
            Solid
          </Option>
          <Option decorator={<HachureFillIcon />} value={FillStyle.HACHURE}>
            Hachure
          </Option>
          <Option
            decorator={<CrossHatchFillIcon />}
            value={FillStyle.CROSS_HATCH}
          >
            Cross hatch
          </Option>
          <Option decorator={<DashedFillIcon />} value={FillStyle.DASHED}>
            Dashed
          </Option>
          <Option decorator={<DottedFillIcon />} value={FillStyle.DOTS}>
            Dots
          </Option>
          <Option decorator={<ZigzagFillIcon />} value={FillStyle.ZIGZAG}>
            Zigzag
          </Option>
          <Option
            decorator={<ZigzagLineFillIcon />}
            value={FillStyle.ZIGZAG_LINE}
          >
            Zigzag line
          </Option>
        </Select>
        <Input
          aria-label={"Layer fill weight"}
          decorator={<RulerMeasureIcon />}
          defaultValue={active_object.get("fillWeight") ?? 1}
          disabled={fill_style === FillStyle.SOLID}
          min={0.1}
          monospaced
          onChange={(event): void => {
            change_fill_weight(Number.parseFloat(event.target.value) ?? 1);
          }}
          placeholder={"Fill weight"}
          size={"sm"}
          slot_props={{
            container: {
              style: { flex: "0.4" }
            }
          }}
          step={0.1}
          title={"Fill weight"}
          type={"number"}
        />
      </DrawItemRow>
      <DrawItemRow>
        <Input
          aria-label={"Layer hachure gap"}
          decorator={<HachureGapIcon />}
          defaultValue={active_object.get("hachureGap") ?? 1}
          disabled={fill_style === FillStyle.SOLID}
          min={0.1}
          monospaced
          onChange={(event): void => {
            change_hachure_gap(Number.parseFloat(event.target.value) ?? 1);
          }}
          placeholder={"Hachure gap"}
          size={"sm"}
          step={0.1}
          title={"Hachure gap"}
          type={"number"}
        />
      </DrawItemRow>
    </>
  );
};

const Fill = (): React.ReactElement | null => {
  const active_object = use_active_object();

  if (!active_object) {
    return null;
  }

  return (
    <DrawItem key={active_object.get("id")} label={"Fill"}>
      <FillControl active_object={active_object} />
      <FillStyleControl active_object={active_object} />
    </DrawItem>
  );
};

export default Fill;
