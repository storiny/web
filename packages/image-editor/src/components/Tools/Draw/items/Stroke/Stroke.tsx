import React from "react";

import Grow from "~/components/Grow";
import Input from "~/components/Input";
import ToggleGroup from "~/components/ToggleGroup";
import ToggleGroupItem from "~/components/ToggleGroupItem";
import ColorPicker, { strToColor, TColor } from "~/entities/ColorPicker";
import LineDashedIcon from "~/icons/LineDashed";
import LineDottedIcon from "~/icons/LineDotted";
import LineSolidIcon from "~/icons/LineSolid";
import RulerMeasureIcon from "~/icons/RulerMeasure";

import { StrokeStyle } from "../../../../../constants";
import { useActiveObject } from "../../../../../store";
import DrawItem, { DrawItemRow } from "../../Item";
import styles from "./Stroke.module.scss";

const strokeLineStyleToDashArrayMap: Record<StrokeStyle, number[]> = {
  [StrokeStyle.SOLID]: [1],
  [StrokeStyle.DASHED]: [5, 5]
};

/**
 * Returns stroke style from an object's stroke dash array
 * @param dashArray Stroke dash array
 */
const getStrokeStyleFromDashArray = (dashArray: number[]): StrokeStyle => {
  for (const [key, value] of Object.entries(strokeLineStyleToDashArrayMap)) {
    if (JSON.stringify(value) === JSON.stringify(dashArray)) {
      return key as StrokeStyle;
    }
  }

  return StrokeStyle.SOLID;
};

const Stroke = (): React.ReactElement | null => {
  const activeObject = useActiveObject();
  const [stroke, setStroke] = React.useState<TColor>(
    strToColor((activeObject?.stroke as string) || "#000000")!
  );
  const [value, setValue] = React.useState(`#${stroke.hex}`);

  React.useEffect(() => {
    setValue(`#${stroke.hex}`);
  }, [stroke]);

  if (!activeObject) {
    return null;
  }

  /**
   * Mutates the stroke color of the object
   * @param newStroke New fill
   */
  const changeStroke = (newStroke: TColor): void => {
    setStroke(newStroke);

    if (activeObject) {
      activeObject.set({
        stroke: newStroke.str
      });
      activeObject.canvas?.renderAll();
    }
  };

  /**
   * Mutates the stroke width of the object
   * @param strokeWidth New stroke width
   */
  const changeStrokeWidth = (strokeWidth: number): void => {
    if (activeObject) {
      activeObject.set({
        strokeWidth
      });
      activeObject.canvas?.renderAll();
    }
  };

  /**
   * Mutates the stroke line cpa of the object
   * @param strokeLineCap New line cap
   */
  const changeStrokeLineCap = (strokeLineCap: CanvasLineCap): void => {
    if (activeObject) {
      activeObject.set({
        strokeLineCap
      });
      activeObject.canvas?.renderAll();
    }
  };

  /**
   * Mutates the stroke style of the object
   * @param strokeStyle New stroke style
   */
  const changeStrokeStyle = (strokeStyle: StrokeStyle): void => {
    if (activeObject) {
      activeObject.set({
        strokeDashArray: strokeLineStyleToDashArrayMap[strokeStyle]
      });
      activeObject.canvas?.renderAll();
    }
  };

  return (
    <DrawItem label={"Stroke"}>
      <DrawItemRow>
        <Input
          aria-label={"Layer stroke"}
          decorator={
            <ColorPicker
              defaultValue={stroke}
              onChange={(value): void => changeStroke(value)}
            >
              <button
                aria-label={"Pick a color"}
                className={styles.indicator}
                style={
                  {
                    "--stroke": stroke.str
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
              changeStroke(newColor);
            }
          }}
          placeholder={"Stroke"}
          size={"sm"}
          slotProps={{
            container: {
              style: { flex: "0.6" }
            }
          }}
          title={"Stroke"}
          value={value}
        />
        <Input
          aria-label={"Layer stroke width"}
          decorator={<RulerMeasureIcon />}
          defaultValue={activeObject.strokeWidth ?? 0}
          min={0}
          monospaced
          onChange={(event): void => {
            changeStrokeWidth(Number.parseInt(event.target.value, 10) ?? 0);
          }}
          placeholder={"Stroke width"}
          size={"sm"}
          slotProps={{
            container: {
              style: { flex: "0.4" }
            }
          }}
          title={"Stroke width"}
          type={"number"}
        />
      </DrawItemRow>
      <DrawItemRow>
        <ToggleGroup
          aria-label={"Stroke line cap"}
          defaultValue={activeObject.strokeLineCap || "butt"}
          onValueChange={(newValue: CanvasLineCap): void =>
            changeStrokeLineCap(newValue)
          }
          orientation={"horizontal"}
          size={"xs"}
          type={"single"}
        >
          <ToggleGroupItem
            aria-label={"Butt"}
            tooltipContent={"Butt"}
            value={"butt"}
          >
            <LineSolidIcon />
          </ToggleGroupItem>
          <ToggleGroupItem
            aria-label={"Round"}
            tooltipContent={"Round"}
            value={"round"}
          >
            <LineDashedIcon />
          </ToggleGroupItem>
          <ToggleGroupItem
            aria-label={"Square"}
            tooltipContent={"Square"}
            value={"square"}
          >
            <LineDottedIcon />
          </ToggleGroupItem>
        </ToggleGroup>
        <Grow />
        <ToggleGroup
          aria-label={"Stroke style"}
          defaultValue={getStrokeStyleFromDashArray(
            activeObject.strokeDashArray ||
              strokeLineStyleToDashArrayMap[StrokeStyle.SOLID]
          )}
          onValueChange={(newValue: StrokeStyle): void =>
            changeStrokeStyle(newValue)
          }
          orientation={"horizontal"}
          size={"xs"}
          type={"single"}
        >
          <ToggleGroupItem
            aria-label={"Solid"}
            tooltipContent={"Solid"}
            value={"solid"}
          >
            <LineSolidIcon />
          </ToggleGroupItem>
          <ToggleGroupItem
            aria-label={"Dashed"}
            tooltipContent={"Dashed"}
            value={"dashed"}
          >
            <LineDashedIcon />
          </ToggleGroupItem>
        </ToggleGroup>
      </DrawItemRow>
    </DrawItem>
  );
};

export default Stroke;
