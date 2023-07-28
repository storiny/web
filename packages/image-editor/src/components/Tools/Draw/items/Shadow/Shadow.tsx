import { BaseFabricObject, Shadow as ObjectShadow } from "fabric";
import React from "react";

import Input from "~/components/Input";
import ColorPicker, { strToColor, TColor } from "~/entities/ColorPicker";
import BlurIcon from "~/icons/Blur";
import LetterXIcon from "~/icons/LetterX";
import LetterYIcon from "~/icons/LetterY";

import { useActiveObject } from "../../../../../store";
import DrawItem, { DrawItemRow } from "../../Item";
import commonStyles from "../common.module.scss";

const DEFAULT_SHADOW_COLOR = "rgba(0,0,0,0)";

// Shadow color

const ShadowColorControl = ({
  activeObject
}: {
  activeObject: BaseFabricObject;
}): React.ReactElement => {
  const [color, setColor] = React.useState<TColor>(
    strToColor((activeObject.shadow?.color as string) || DEFAULT_SHADOW_COLOR)!
  );
  const [value, setValue] = React.useState(`#${color.hex}`);

  /**
   * Mutates the shadow color of the object
   */
  const changeColor = React.useCallback(
    (newColor: TColor) => {
      setColor(newColor);

      if (activeObject) {
        if (activeObject.shadow) {
          activeObject.shadow.color = newColor.str;
        } else {
          activeObject.set({
            shadow: new ObjectShadow({ color: newColor.str })
          });
        }

        activeObject.dirty = true;
        activeObject.canvas?.requestRenderAll();
      }
    },
    [activeObject]
  );

  React.useEffect(() => {
    setValue(`#${color.hex}`);
  }, [color]);

  return (
    <Input
      aria-label={"Layer shadow color"}
      decorator={
        <ColorPicker
          defaultValue={color}
          onChange={(value): void => changeColor(value)}
        >
          <button
            aria-label={"Pick a color"}
            className={commonStyles.indicator}
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
  );
};

// Shadow blur

const ShadowBlurControl = ({
  activeObject
}: {
  activeObject: BaseFabricObject;
}): React.ReactElement => {
  /**
   * Mutates the shadow blur of the object
   */
  const changeBlur = React.useCallback(
    (blur: number) => {
      if (activeObject) {
        if (activeObject.shadow) {
          activeObject.shadow.blur = blur;
        } else {
          activeObject.set({
            shadow: new ObjectShadow({ blur, color: DEFAULT_SHADOW_COLOR })
          });
        }

        activeObject.dirty = true;
        activeObject.canvas?.requestRenderAll();
      }
    },
    [activeObject]
  );

  return (
    <Input
      aria-label={"Layer shadow blur"}
      decorator={<BlurIcon />}
      defaultValue={activeObject.shadow?.blur ?? 0}
      min={0}
      monospaced
      onChange={(event): void => {
        changeBlur(Number.parseInt(event.target.value, 10) ?? 0);
      }}
      placeholder={"Shadow blur"}
      size={"sm"}
      slotProps={{
        container: {
          style: { flex: "0.4" }
        }
      }}
      title={"Shadow blur"}
      type={"number"}
    />
  );
};

// Shadow offsets

const ShadowOffsetsControl = ({
  activeObject
}: {
  activeObject: BaseFabricObject;
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
        if (activeObject.shadow) {
          activeObject.shadow[offsetProp] = offset;
        } else {
          activeObject.set({
            shadow: new ObjectShadow({
              [offsetProp]: offset,
              color: DEFAULT_SHADOW_COLOR
            })
          });
        }

        activeObject.dirty = true;
        activeObject.canvas?.requestRenderAll();
      }
    },
    [activeObject]
  );

  return (
    <React.Fragment>
      <Input
        aria-label={"Shadow offset X"}
        decorator={<LetterXIcon />}
        defaultValue={Math.round(activeObject.shadow?.offsetX ?? 0)}
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
        defaultValue={Math.round(activeObject.shadow?.offsetY ?? 0)}
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

const Shadow = (): React.ReactElement | null => {
  const activeObject = useActiveObject();

  if (!activeObject) {
    return null;
  }

  return (
    <DrawItem label={"Shadow"}>
      <DrawItemRow>
        <ShadowColorControl activeObject={activeObject} />
        <ShadowBlurControl activeObject={activeObject} />
      </DrawItemRow>
      <DrawItemRow>
        <ShadowOffsetsControl activeObject={activeObject} />
      </DrawItemRow>
    </DrawItem>
  );
};

export default Shadow;
