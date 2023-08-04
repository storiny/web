import { clsx } from "clsx";
import { BaseFabricObject } from "fabric";
import React from "react";

import Input from "~/components/Input";
import Option from "~/components/Option";
import Select from "~/components/Select";
import ColorPicker, {
  hexToRgb,
  strToColor,
  TColor
} from "~/entities/ColorPicker";
import CrossHatchFillIcon from "~/icons/CrossHatchFill";
import DashedFillIcon from "~/icons/DashedFill";
import DottedFillIcon from "~/icons/DottedFill";
import HachureFillIcon from "~/icons/HachureFill";
import HachureGapIcon from "~/icons/HachureGap";
import RulerMeasureIcon from "~/icons/RulerMeasure";
import SolidFillIcon from "~/icons/SolidFill";
import ZigzagFillIcon from "~/icons/ZigzagFill";
import ZigzagLineFillIcon from "~/icons/ZigzagLineFill";

import {
  DEFAULT_LAYER_FILL,
  FillStyle,
  MAX_OPACITY,
  MIN_OPACITY
} from "../../../../../constants";
import { useActiveObject } from "../../../../../hooks";
import { modifyObject } from "../../../../../utils";
import DrawItem, { DrawItemRow } from "../../Item";
import commonStyles from "../common.module.scss";

// Fill

const FillControl = ({
  activeObject
}: {
  activeObject: BaseFabricObject;
}): React.ReactElement => {
  const [fill, setFill] = React.useState<TColor>(
    strToColor((activeObject?.fill as string) || DEFAULT_LAYER_FILL)!
  );
  const [value, setValue] = React.useState(`#${fill.hex}`);

  /**
   * Mutates the fill of the object
   */
  const changeFill = React.useCallback(
    (newFill: TColor) => {
      setFill(newFill);

      if (activeObject) {
        modifyObject(activeObject, {
          fill: newFill.str
        });
      }
    },
    [activeObject]
  );

  React.useEffect(() => {
    setValue(`#${fill.hex}`);
  }, [fill]);

  React.useEffect(() => {
    setFill(strToColor((activeObject?.fill as string) || DEFAULT_LAYER_FILL)!);
  }, [activeObject?.fill]);

  return (
    <DrawItemRow>
      <Input
        aria-label={"Layer fill"}
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
        slotProps={{
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
          const { r, g, b } = hexToRgb(fill.hex);

          changeFill({
            ...fill,
            str: `rgba(${r},${g},${b},${a / 100})`,
            a
          });
        }}
        placeholder={"Fill opacity"}
        size={"sm"}
        slotProps={{
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
  activeObject
}: {
  activeObject: BaseFabricObject;
}): React.ReactElement => {
  const [fillStyle, setFillStyle] = React.useState<FillStyle>(
    activeObject?.get("fillStyle") || FillStyle.SOLID
  );

  /**
   * Mutates the fill style of the object
   */
  const changeFillStyle = React.useCallback(
    (fillStyle: FillStyle) => {
      setFillStyle(fillStyle);

      if (activeObject) {
        modifyObject(activeObject, {
          fillStyle
        });
      }
    },
    [activeObject]
  );

  /**
   * Mutates the fill weight of the object
   */
  const changeFillWeight = React.useCallback(
    (fillWeight: number) => {
      if (activeObject) {
        modifyObject(activeObject, { fillWeight });
      }
    },
    [activeObject]
  );

  /**
   * Mutates the hachure gap of the object
   */
  const changeHachureGap = React.useCallback(
    (hachureGap: number) => {
      if (activeObject) {
        modifyObject(activeObject, { hachureGap });
      }
    },
    [activeObject]
  );

  React.useEffect(() => {
    setFillStyle(activeObject?.get("fillStyle") || FillStyle.SOLID);
  }, [activeObject]);

  return (
    <>
      <DrawItemRow>
        <Select
          onValueChange={(newValue: FillStyle): void =>
            changeFillStyle(newValue)
          }
          size={"sm"}
          slotProps={{
            trigger: {
              className: clsx("full-w"),
              style: { flex: "0.6" }
            }
          }}
          value={fillStyle}
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
          defaultValue={activeObject.get("fillWeight") ?? 1}
          disabled={fillStyle === FillStyle.SOLID}
          min={0.1}
          monospaced
          onChange={(event): void => {
            changeFillWeight(Number.parseFloat(event.target.value) ?? 1);
          }}
          placeholder={"Fill weight"}
          size={"sm"}
          slotProps={{
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
          defaultValue={activeObject.get("hachureGap") ?? 1}
          disabled={fillStyle === FillStyle.SOLID}
          min={0.1}
          monospaced
          onChange={(event): void => {
            changeHachureGap(Number.parseFloat(event.target.value) ?? 1);
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
  const activeObject = useActiveObject();

  if (!activeObject) {
    return null;
  }

  return (
    <DrawItem key={activeObject.get("id")} label={"Fill"}>
      <FillControl activeObject={activeObject} />
      <FillStyleControl activeObject={activeObject} />
    </DrawItem>
  );
};

export default Fill;
