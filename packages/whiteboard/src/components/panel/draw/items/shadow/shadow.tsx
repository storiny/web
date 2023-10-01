import clsx from "clsx";
import { BaseFabricObject, Canvas, Shadow as ObjectShadow } from "fabric";
import React from "react";

import Input from "~/components/input";
import ColorPicker, {
  hex_to_rgb,
  str_to_color,
  TColor
} from "~/entities/color-picker";
import BlurIcon from "~/icons/blur";
import LetterXIcon from "~/icons/letter-x";
import LetterYIcon from "~/icons/letter-y";

import { MAX_OPACITY, MIN_OPACITY } from "../../../../../constants";
import { use_active_object, use_canvas } from "../../../../../hooks";
import { modify_object } from "../../../../../utils";
import DrawItem, { DrawItemRow } from "../../item";
import common_styles from "../common.module.scss";

const DEFAULT_SHADOW_COLOR = "rgba(0,0,0,0)";

// Shadow color

const ShadowColorControl = ({
  active_object,
  canvas
}: {
  active_object?: BaseFabricObject;
  canvas: Canvas;
}): React.ReactElement => {
  const [color, set_color] = React.useState<TColor>(
    str_to_color(
      (active_object?.shadow?.color as string) ||
        canvas.freeDrawingBrush?.shadow?.color ||
        DEFAULT_SHADOW_COLOR
    )!
  );
  const [value, set_value] = React.useState(`#${color.hex}`);

  /**
   * Mutates the shadow color of the object
   */
  const change_color = React.useCallback(
    (next_color: TColor) => {
      set_color(next_color);

      if (active_object) {
        modify_object(active_object, {
          shadow: new ObjectShadow({
            ...active_object.shadow,
            color: next_color.str
          })
        });
      } else if (canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.shadow = new ObjectShadow({
          ...canvas.freeDrawingBrush.shadow,
          color: next_color.str
        });
      }
    },
    [active_object, canvas.freeDrawingBrush]
  );

  React.useEffect(() => {
    set_value(`#${color.hex}`);
  }, [color]);

  React.useEffect(() => {
    set_color(
      str_to_color(
        (active_object?.shadow?.color as string) ||
          canvas.freeDrawingBrush?.shadow?.color ||
          DEFAULT_SHADOW_COLOR
      )!
    );
  }, [active_object?.shadow?.color, canvas.freeDrawingBrush?.shadow?.color]);

  return (
    <DrawItemRow>
      <Input
        aria-label={"Layer shadow color"}
        decorator={
          <ColorPicker default_value={color} on_change={change_color}>
            <button
              aria-label={"Pick a color"}
              className={clsx(
                "focusable",
                "focus-invert",
                common_styles.indicator
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
          set_value(event.target.value);
          const next_color = str_to_color(event.target.value);
          if (next_color) {
            change_color(next_color);
          }
        }}
        placeholder={"Shadow color"}
        size={"sm"}
        slot_props={{
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
          const { r, g, b } = hex_to_rgb(color.hex);

          change_color({
            ...color,
            str: `rgba(${r},${g},${b},${a / 100})`,
            a
          });
        }}
        placeholder={"Shadow opacity"}
        size={"sm"}
        slot_props={{
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
  active_object,
  canvas
}: {
  active_object?: BaseFabricObject;
  canvas: Canvas;
}): React.ReactElement => {
  /**
   * Mutates the shadow blur of the object
   */
  const change_blur = React.useCallback(
    (next_blur: number) => {
      if (active_object) {
        modify_object(active_object, {
          shadow: new ObjectShadow({
            color: DEFAULT_SHADOW_COLOR,
            ...active_object.shadow,
            blur: next_blur
          })
        });
      } else if (canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.shadow = new ObjectShadow({
          color: DEFAULT_SHADOW_COLOR,
          ...canvas.freeDrawingBrush.shadow,
          blur: next_blur
        });
      }
    },
    [active_object, canvas.freeDrawingBrush]
  );

  return (
    <Input
      aria-label={"Layer shadow blur"}
      decorator={<BlurIcon />}
      defaultValue={
        active_object?.shadow?.blur ??
        canvas.freeDrawingBrush?.shadow?.blur ??
        0
      }
      min={0}
      monospaced
      onChange={(event): void => {
        change_blur(Number.parseInt(event.target.value, 10) ?? 0);
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
  active_object,
  canvas
}: {
  active_object?: BaseFabricObject;
  canvas: Canvas;
}): React.ReactElement => {
  /**
   * Mutates the shadow blur of the object
   */
  const change_offset = React.useCallback(
    (offset: number, axis: "x" | "y") => {
      const offset_prop =
        `offset${axis.toUpperCase()}` as `offset${typeof axis extends "x"
          ? "X"
          : "Y"}`;

      if (active_object) {
        modify_object(active_object, {
          shadow: new ObjectShadow({
            color: DEFAULT_SHADOW_COLOR,
            ...active_object.shadow,
            [offset_prop]: offset
          })
        });
      } else if (canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.shadow = new ObjectShadow({
          color: DEFAULT_SHADOW_COLOR,
          ...canvas.freeDrawingBrush.shadow,
          [offset_prop]: offset
        });
      }
    },
    [active_object, canvas.freeDrawingBrush]
  );

  return (
    <React.Fragment>
      <Input
        aria-label={"Shadow offset X"}
        decorator={<LetterXIcon />}
        defaultValue={Math.round(
          active_object?.shadow?.offsetX ??
            canvas.freeDrawingBrush?.shadow?.offsetX ??
            0
        )}
        monospaced
        onChange={(event): void =>
          change_offset(Number.parseInt(event.target.value, 10) ?? 0, "x")
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
          active_object?.shadow?.offsetY ??
            canvas.freeDrawingBrush?.shadow?.offsetY ??
            0
        )}
        monospaced
        onChange={(event): void =>
          change_offset(Number.parseInt(event.target.value, 10) ?? 0, "y")
        }
        placeholder={"Offset Y"}
        size={"sm"}
        title={"Shadow offset Y"}
        type={"number"}
      />
    </React.Fragment>
  );
};

const Shadow = ({
  is_pen
}: {
  is_pen?: boolean;
}): React.ReactElement | null => {
  const canvas = use_canvas();
  const active_object = use_active_object();

  if (!canvas.current || (!active_object && !is_pen)) {
    return null;
  }

  return (
    <DrawItem key={active_object?.get("id")} label={"Shadow"}>
      <ShadowColorControl
        active_object={active_object || undefined}
        canvas={canvas.current}
      />
      <DrawItemRow>
        <ShadowBlurControl
          active_object={active_object || undefined}
          canvas={canvas.current}
        />
      </DrawItemRow>
      <DrawItemRow>
        <ShadowOffsetsControl
          active_object={active_object || undefined}
          canvas={canvas.current}
        />
      </DrawItemRow>
    </DrawItem>
  );
};

export default Shadow;
