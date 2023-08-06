import { clsx } from "clsx";
import { BaseFabricObject } from "fabric";
import React from "react";

import IconButton from "~/components/IconButton";
import Input from "~/components/Input";
import Option from "~/components/Option";
import Select from "~/components/Select";
import Tooltip from "~/components/Tooltip";
import ColorPicker, {
  hexToRgb,
  strToColor,
  TColor
} from "~/entities/ColorPicker";
import ArrowheadArrowIcon from "~/icons/ArrowheadArrow";
import ArrowheadArrowLongIcon from "~/icons/ArrowheadArrowLong";
import ArrowheadBarIcon from "~/icons/ArrowheadBar";
import ArrowheadBarLongIcon from "~/icons/ArrowheadBarLong";
import ArrowheadDotIcon from "~/icons/ArrowheadDot";
import ArrowheadDotLongIcon from "~/icons/ArrowheadDotLong";
import ArrowheadNoneIcon from "~/icons/ArrowheadNone";
import ArrowheadNoneLongIcon from "~/icons/ArrowheadNoneLong";
import ArrowheadTriangleIcon from "~/icons/ArrowheadTriangle";
import ArrowheadTriangleLongIcon from "~/icons/ArrowheadTriangleLong";
import LineDashedIcon from "~/icons/LineDashed";
import LineDottedIcon from "~/icons/LineDotted";
import LineSolidIcon from "~/icons/LineSolid";
import RulerMeasureIcon from "~/icons/RulerMeasure";
import SwapIcon from "~/icons/Swap";

import {
  Arrowhead,
  MAX_OPACITY,
  MIN_OPACITY,
  StrokeStyle
} from "../../../../../constants";
import { useActiveObject } from "../../../../../hooks";
import { isArrowObject, modifyObject } from "../../../../../utils";
import DrawItem, { DrawItemRow } from "../../Item";
import commonStyles from "../common.module.scss";
import styles from "./Stroke.module.scss";

const DEFAULT_LAYER_STROKE = "rgba(0,0,0,0)";

/**
 * Returns the arrowhead icon
 * @param arrowhead Arrowhead
 * @param position Arrowhead position
 */
const getArrowheadIcon = (
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
  activeObject
}: {
  activeObject: BaseFabricObject;
}): React.ReactElement => {
  const [stroke, setStroke] = React.useState<TColor>(
    strToColor((activeObject.stroke as string) || DEFAULT_LAYER_STROKE)!
  );
  const [value, setValue] = React.useState(`#${stroke.hex}`);

  /**
   * Mutates the stroke color of the object
   */
  const changeStroke = React.useCallback(
    (newStroke: TColor) => {
      setStroke(newStroke);

      if (activeObject) {
        modifyObject(activeObject, {
          stroke: newStroke.str
        });
      }
    },
    [activeObject]
  );

  React.useEffect(() => {
    setValue(`#${stroke.hex}`);
  }, [stroke]);

  React.useEffect(() => {
    setStroke(
      strToColor((activeObject?.stroke as string) || DEFAULT_LAYER_STROKE)!
    );
  }, [activeObject?.stroke]);

  return (
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
              className={clsx(
                "focusable",
                "focus-invert",
                commonStyles.indicator
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
        aria-label={"Layer stroke opacity"}
        max={MAX_OPACITY}
        min={MIN_OPACITY}
        monospaced
        onChange={(event): void => {
          const a = Number.parseInt(event.target.value) || 0;
          const { r, g, b } = hexToRgb(stroke.hex);

          changeStroke({
            ...stroke,
            str: `rgba(${r},${g},${b},${a / 100})`,
            a
          });
        }}
        placeholder={"Stroke opacity"}
        size={"sm"}
        slotProps={{
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
  activeObject,
  disableStrokeStyle
}: {
  activeObject: BaseFabricObject;
  disableStrokeStyle: boolean;
}): React.ReactElement => {
  /**
   * Mutates the stroke width of the object
   */
  const changeStrokeWidth = React.useCallback(
    (strokeWidth: number) => {
      if (activeObject) {
        modifyObject(activeObject, {
          strokeWidth
        });
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
          style: {
            flex: disableStrokeStyle ? "1" : "0.4"
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
        modifyObject(activeObject, {
          strokeStyle: newStrokeStyle
        });
      }
    },
    [activeObject]
  );

  React.useEffect(() => {
    setStrokeStyle(activeObject.get("strokeStyle") || StrokeStyle.SOLID);
  }, [activeObject]);

  return (
    <Select
      onValueChange={(newValue: StrokeStyle): void =>
        changeStrokeStyle(newValue)
      }
      size={"sm"}
      slotProps={{
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

// Arrowhead style

const ArrowheadControl = ({
  activeObject
}: {
  activeObject: BaseFabricObject;
}): React.ReactElement => {
  const [startArrowhead, setStartArrowhead] = React.useState<Arrowhead>(
    activeObject.get("startArrowhead") || Arrowhead.NONE
  );
  const [endArrowhead, setEndArrowhead] = React.useState<Arrowhead>(
    activeObject.get("endArrowhead") || Arrowhead.ARROW
  );

  /**
   * Mutates the arrowhead of the object
   */
  const changeArrowhead = React.useCallback(
    (arrowhead: Arrowhead, position: "start" | "end") => {
      (position === "start" ? setStartArrowhead : setEndArrowhead)(arrowhead);

      if (activeObject) {
        modifyObject(activeObject, {
          [position === "start" ? "startArrowhead" : "endArrowhead"]: arrowhead
        });
      }
    },
    [activeObject]
  );

  /**
   * Swaps the start and end arrowheads
   */
  const swapArrowheads = React.useCallback(() => {
    const currentStartArrowhead = startArrowhead;
    setStartArrowhead(endArrowhead);
    setEndArrowhead(currentStartArrowhead);

    if (activeObject) {
      modifyObject(activeObject, {
        startArrowhead: endArrowhead,
        endArrowhead: currentStartArrowhead
      });
    }
  }, [activeObject, endArrowhead, startArrowhead]);

  React.useEffect(() => {
    setStartArrowhead(activeObject.get("startArrowhead") || Arrowhead.NONE);
    setEndArrowhead(activeObject.get("endArrowhead") || Arrowhead.ARROW);
  }, [activeObject]);

  return (
    <DrawItemRow>
      <Select
        onValueChange={(newValue: Arrowhead): void =>
          changeArrowhead(newValue, "start")
        }
        size={"sm"}
        slotProps={{
          content: {
            style: {
              zIndex: "calc(var(--z-index-modal) + 2)"
            }
          },
          trigger: {
            className: clsx("full-w")
          }
        }}
        value={startArrowhead}
        valueChildren={
          <span className={clsx("flex-center", styles["arrowhead-value"])}>
            {getArrowheadIcon(startArrowhead, "start")}
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
          onClick={swapArrowheads}
          size={"sm"}
          style={{ "--size": "24px" } as React.CSSProperties}
          variant={"ghost"}
        >
          <SwapIcon />
        </IconButton>
      </Tooltip>
      <Select
        onValueChange={(newValue: Arrowhead): void =>
          changeArrowhead(newValue, "end")
        }
        size={"sm"}
        slotProps={{
          content: {
            style: {
              zIndex: "calc(var(--z-index-modal) + 2)"
            }
          },
          trigger: {
            className: clsx("full-w")
          }
        }}
        value={endArrowhead}
        valueChildren={
          <span className={clsx("flex-center", styles["arrowhead-value"])}>
            {getArrowheadIcon(endArrowhead, "end")}
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
  disableStrokeStyle
}: {
  disableStrokeStyle?: boolean;
}): React.ReactElement | null => {
  const activeObject = useActiveObject();

  if (!activeObject) {
    return null;
  }

  return (
    <DrawItem key={activeObject.get("id")} label={"Stroke"}>
      <StrokeControl activeObject={activeObject} />
      <DrawItemRow>
        {!disableStrokeStyle && (
          <StrokeStyleControl activeObject={activeObject} />
        )}
        <StrokeWidthControl
          activeObject={activeObject}
          disableStrokeStyle={Boolean(disableStrokeStyle)}
        />
      </DrawItemRow>
      {isArrowObject(activeObject) && (
        <ArrowheadControl activeObject={activeObject} />
      )}
    </DrawItem>
  );
};

export default Stroke;
