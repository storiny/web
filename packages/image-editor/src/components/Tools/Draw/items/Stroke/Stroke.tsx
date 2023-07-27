import { clsx } from "clsx";
import { BaseFabricObject } from "fabric";
import React from "react";

import Input from "~/components/Input";
import Option from "~/components/Option";
import Select from "~/components/Select";
import ColorPicker, { strToColor, TColor } from "~/entities/ColorPicker";
import LineDashedIcon from "~/icons/LineDashed";
import LineDottedIcon from "~/icons/LineDotted";
import LineSolidIcon from "~/icons/LineSolid";
import RulerMeasureIcon from "~/icons/RulerMeasure";

import { StrokeStyle } from "../../../../../constants";
import { useActiveObject } from "../../../../../store";
import DrawItem, { DrawItemRow } from "../../Item";
import styles from "./Stroke.module.scss";

// Stroke color

const StrokeControl = ({
  activeObject
}: {
  activeObject: BaseFabricObject;
}): React.ReactElement => {
  const [stroke, setStroke] = React.useState<TColor>(
    strToColor((activeObject.stroke as string) || "rgba(0,0,0,0)")!
  );
  const [value, setValue] = React.useState(`#${stroke.hex}`);

  /**
   * Mutates the stroke color of the object
   */
  const changeStroke = React.useCallback(
    (newStroke: TColor) => {
      setStroke(newStroke);

      if (activeObject) {
        activeObject.set({
          stroke: newStroke.str,
          dirty: true
        });
        activeObject.canvas?.requestRenderAll();
      }
    },
    [activeObject]
  );

  React.useEffect(() => {
    setValue(`#${stroke.hex}`);
  }, [stroke]);

  return (
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
  );
};

// Stroke width

const StrokeWidthControl = ({
  activeObject
}: {
  activeObject: BaseFabricObject;
}): React.ReactElement => {
  /**
   * Mutates the stroke width of the object
   */
  const changeStrokeWidth = React.useCallback(
    (strokeWidth: number) => {
      if (activeObject) {
        activeObject.set({
          strokeWidth,
          dirty: true
        });
        activeObject.canvas?.requestRenderAll();
      }
    },
    [activeObject]
  );

  return (
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
  );
};

// Stroke style

const StrokeStyleControl = ({
  activeObject
}: {
  activeObject: BaseFabricObject;
}): React.ReactElement => {
  const [strokeStyle, setStrokeStyle] = React.useState<StrokeStyle>(
    activeObject.get("strokeStyle") || StrokeStyle.SOLID
  );

  /**
   * Mutates the stroke style of the object
   */
  const changeStrokeStyle = React.useCallback(
    (newStrokeStyle: StrokeStyle) => {
      setStrokeStyle(newStrokeStyle);

      if (activeObject) {
        activeObject.set({
          strokeStyle: newStrokeStyle,
          dirty: true
        });
        activeObject.canvas?.requestRenderAll();
      }
    },
    [activeObject]
  );

  return (
    <Select
      onValueChange={(newValue: StrokeStyle): void =>
        changeStrokeStyle(newValue)
      }
      size={"sm"}
      slotProps={{
        trigger: {
          className: clsx("full-w")
        }
      }}
      value={strokeStyle}
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

const Stroke = (): React.ReactElement | null => {
  const activeObject = useActiveObject();

  if (!activeObject) {
    return null;
  }

  return (
    <DrawItem label={"Stroke"}>
      <DrawItemRow>
        <StrokeControl activeObject={activeObject} />
        <StrokeWidthControl activeObject={activeObject} />
      </DrawItemRow>
      <DrawItemRow>
        <StrokeStyleControl activeObject={activeObject} />
      </DrawItemRow>
    </DrawItem>
  );
};

export default Stroke;
