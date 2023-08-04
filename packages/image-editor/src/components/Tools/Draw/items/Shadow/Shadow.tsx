import clsx from "clsx";
import { BaseFabricObject, Canvas, Shadow as ObjectShadow } from "fabric";
import React from "react";

import Input from "~/components/Input";
import ColorPicker, {
  hexToRgb,
  strToColor,
  TColor
} from "~/entities/ColorPicker";
import BlurIcon from "~/icons/Blur";
import LetterXIcon from "~/icons/LetterX";
import LetterYIcon from "~/icons/LetterY";

import { MAX_OPACITY, MIN_OPACITY } from "../../../../../constants";
import { useActiveObject, useCanvas } from "../../../../../hooks";
import { modifyObject } from "../../../../../utils";
import DrawItem, { DrawItemRow } from "../../Item";
import commonStyles from "../common.module.scss";

const DEFAULT_SHADOW_COLOR = "rgba(0,0,0,0)";

// Shadow color

const ShadowColorControl = ({
  activeObject,
  canvas
}: {
  activeObject?: BaseFabricObject;
  canvas: Canvas;
}): React.ReactElement => {
  const [color, setColor] = React.useState<TColor>(
    strToColor(
      (activeObject?.shadow?.color as string) ||
        canvas.freeDrawingBrush?.shadow?.color ||
        DEFAULT_SHADOW_COLOR
    )!
  );
  const [value, setValue] = React.useState(`#${color.hex}`);

  /**
   * Mutates the shadow color of the object
   */
  const changeColor = React.useCallback(
    (newColor: TColor) => {
      setColor(newColor);

      if (activeObject) {
        modifyObject(activeObject, {
          shadow: new ObjectShadow({
            ...activeObject.shadow,
            color: newColor.str
          })
        });
      } else if (canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.shadow = new ObjectShadow({
          ...canvas.freeDrawingBrush.shadow,
          color: newColor.str
        });
      }
    },
    [activeObject, canvas.freeDrawingBrush]
  );

  React.useEffect(() => {
    setValue(`#${color.hex}`);
  }, [color]);

  React.useEffect(() => {
    setColor(
      strToColor(
        (activeObject?.shadow?.color as string) ||
          canvas.freeDrawingBrush?.shadow?.color ||
          DEFAULT_SHADOW_COLOR
      )!
    );
  }, [activeObject?.shadow?.color, canvas.freeDrawingBrush?.shadow?.color]);

  return (
    <DrawItemRow>
      <Input
        aria-label={"Layer shadow color"}
        decorator={
          <ColorPicker
            defaultValue={color}
            onChange={(value): void => changeColor(value)}
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
                  "--color": color.str
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
            changeColor(newColor);
          }
        }}
        placeholder={"Shadow color"}
        size={"sm"}
        slotProps={{
          container: {
            style: { flex: "0.6" }
          }
        }}
        title={"Shadow color"}
        value={value}
      />
      <Input
        aria-label={"Layer shadow opacity"}
        max={MAX_OPACITY}
        min={MIN_OPACITY}
        monospaced
        onChange={(event): void => {
          const a = Number.parseInt(event.target.value) || 0;
          const { r, g, b } = hexToRgb(color.hex);

          changeColor({
            ...color,
            str: `rgba(${r},${g},${b},${a / 100})`,
            a
          });
        }}
        placeholder={"Shadow opacity"}
        size={"sm"}
        slotProps={{
          container: {
            style: {
              flex: "0.4"
            }
          }
        }}
        title={"Shadow opacity"}
        type={"number"}
        value={Math.round(color.a)}
      />
    </DrawItemRow>
  );
};

// Shadow blur

const ShadowBlurControl = ({
  activeObject,
  canvas
}: {
  activeObject?: BaseFabricObject;
  canvas: Canvas;
}): React.ReactElement => {
  /**
   * Mutates the shadow blur of the object
   */
  const changeBlur = React.useCallback(
    (blur: number) => {
      if (activeObject) {
        modifyObject(activeObject, {
          shadow: new ObjectShadow({
            color: DEFAULT_SHADOW_COLOR,
            ...activeObject.shadow,
            blur
          })
        });
      } else if (canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.shadow = new ObjectShadow({
          color: DEFAULT_SHADOW_COLOR,
          ...canvas.freeDrawingBrush.shadow,
          blur
        });
      }
    },
    [activeObject, canvas.freeDrawingBrush]
  );

  return (
    <Input
      aria-label={"Layer shadow blur"}
      decorator={<BlurIcon />}
      defaultValue={
        activeObject?.shadow?.blur ?? canvas.freeDrawingBrush?.shadow?.blur ?? 0
      }
      min={0}
      monospaced
      onChange={(event): void => {
        changeBlur(Number.parseInt(event.target.value, 10) ?? 0);
      }}
      placeholder={"Shadow blur"}
      size={"sm"}
      title={"Shadow blur"}
      type={"number"}
    />
  );
};

// Shadow offsets

const ShadowOffsetsControl = ({
  activeObject,
  canvas
}: {
  activeObject?: BaseFabricObject;
  canvas: Canvas;
}): React.ReactElement => {
  /**
   * Mutates the shadow blur of the object
   */
  const changeOffset = React.useCallback(
    (offset: number, axis: "x" | "y") => {
      const offsetProp =
        `offset${axis.toUpperCase()}` as `offset${typeof axis extends "x"
          ? "X"
          : "Y"}`;

      if (activeObject) {
        modifyObject(activeObject, {
          shadow: new ObjectShadow({
            color: DEFAULT_SHADOW_COLOR,
            ...activeObject.shadow,
            [offsetProp]: offset
          })
        });
      } else if (canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.shadow = new ObjectShadow({
          color: DEFAULT_SHADOW_COLOR,
          ...canvas.freeDrawingBrush.shadow,
          [offsetProp]: offset
        });
      }
    },
    [activeObject, canvas.freeDrawingBrush]
  );

  return (
    <React.Fragment>
      <Input
        aria-label={"Shadow offset X"}
        decorator={<LetterXIcon />}
        defaultValue={Math.round(
          activeObject?.shadow?.offsetX ??
            canvas.freeDrawingBrush?.shadow?.offsetX ??
            0
        )}
        monospaced
        onChange={(event): void =>
          changeOffset(Number.parseInt(event.target.value, 10) ?? 0, "x")
        }
        placeholder={"Offset X"}
        size={"sm"}
        title={"Shadow offset X"}
        type={"number"}
      />
      <Input
        aria-label={"Shadow offset Y"}
        decorator={<LetterYIcon />}
        defaultValue={Math.round(
          activeObject?.shadow?.offsetY ??
            canvas.freeDrawingBrush?.shadow?.offsetY ??
            0
        )}
        monospaced
        onChange={(event): void =>
          changeOffset(Number.parseInt(event.target.value, 10) ?? 0, "y")
        }
        placeholder={"Offset Y"}
        size={"sm"}
        title={"Shadow offset Y"}
        type={"number"}
      />
    </React.Fragment>
  );
};

const Shadow = ({ isPen }: { isPen?: boolean }): React.ReactElement | null => {
  const canvas = useCanvas();
  const activeObject = useActiveObject();

  if (!canvas.current || (!activeObject && !isPen)) {
    return null;
  }

  return (
    <DrawItem key={activeObject?.get("id")} label={"Shadow"}>
      <ShadowColorControl
        activeObject={activeObject || undefined}
        canvas={canvas.current}
      />
      <DrawItemRow>
        <ShadowBlurControl
          activeObject={activeObject || undefined}
          canvas={canvas.current}
        />
      </DrawItemRow>
      <DrawItemRow>
        <ShadowOffsetsControl
          activeObject={activeObject || undefined}
          canvas={canvas.current}
        />
      </DrawItemRow>
    </DrawItem>
  );
};

export default Shadow;
