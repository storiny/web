import { useAtom } from "jotai";
import React, { useEffect, useState } from "react";

import {
  ColorPaletteCustom,
  DEFAULT_ELEMENT_BACKGROUND_COLOR_INDEX,
  DEFAULT_ELEMENT_STROKE_COLOR_INDEX
} from "../../colors";
import { EVENT } from "../../constants";
import { t } from "../../i18n";
import { KEYS } from "../../keys";
import { ExcalidrawLayer } from "../../layer/types";
import {
  activeColorPickerSectionAtom,
  ColorPickerType,
  getColorNameAndShadeFromColor,
  getMostUsedCustomColors,
  isCustomColor
} from "./colorPickerUtils";
import { CustomColorList } from "./CustomColorList";
import { colorPickerKeyNavHandler } from "./keyboardNavHandlers";
import PickerColorList from "./PickerColorList";
import PickerHeading from "./PickerHeading";
import { ShadeList } from "./ShadeList";

interface PickerProps {
  children?: React.ReactNode;
  color: string;
  label: string;
  layers: readonly ExcalidrawLayer[];
  onChange: (color: string) => void;
  onEscape: (event: React.KeyboardEvent | KeyboardEvent) => void;
  onEyeDropperToggle: (force?: boolean) => void;
  palette: ColorPaletteCustom;
  type: ColorPickerType;
  updateData: (formData?: any) => void;
}

export const Picker = ({
  color,
  onChange,
  label,
  type,
  layers,
  palette,
  updateData,
  children,
  onEyeDropperToggle,
  onEscape
}: PickerProps) => {
  const [customColors] = React.useState(() => {
    if (type === "canvasBackground") {
      return [];
    }
    return getMostUsedCustomColors(layers, type, palette);
  });

  const [activeColorPickerSection, setActiveColorPickerSection] = useAtom(
    activeColorPickerSectionAtom
  );

  const colorObj = getColorNameAndShadeFromColor({
    color,
    palette
  });

  useEffect(() => {
    if (!activeColorPickerSection) {
      const isCustom = isCustomColor({ color, palette });
      const isCustomButNotInList = isCustom && !customColors.includes(color);

      setActiveColorPickerSection(
        isCustomButNotInList
          ? "hex"
          : isCustom
          ? "custom"
          : colorObj?.shade != null
          ? "shades"
          : "baseColors"
      );
    }
  }, [
    activeColorPickerSection,
    color,
    palette,
    setActiveColorPickerSection,
    colorObj,
    customColors
  ]);

  const [activeShade, setActiveShade] = useState(
    colorObj?.shade ??
      (type === "layerBackground"
        ? DEFAULT_ELEMENT_BACKGROUND_COLOR_INDEX
        : DEFAULT_ELEMENT_STROKE_COLOR_INDEX)
  );

  useEffect(() => {
    if (colorObj?.shade != null) {
      setActiveShade(colorObj.shade);
    }

    const keyup = (event: KeyboardEvent) => {
      if (event.key === KEYS.ALT) {
        onEyeDropperToggle(false);
      }
    };
    document.addEventListener(EVENT.KEYUP, keyup, { capture: true });
    return () => {
      document.removeEventListener(EVENT.KEYUP, keyup, { capture: true });
    };
  }, [colorObj, onEyeDropperToggle]);

  const pickerRef = React.useRef<HTMLDivLayer>(null);

  return (
    <div aria-label={t("labels.colorPicker")} aria-modal="true" role="dialog">
      <div
        onKeyDown={(event) => {
          const handled = colorPickerKeyNavHandler({
            event,
            activeColorPickerSection,
            palette,
            color,
            onChange,
            onEyeDropperToggle,
            customColors,
            setActiveColorPickerSection,
            updateData,
            activeShade,
            onEscape
          });

          if (handled) {
            event.preventDefault();
            event.stopPropagation();
          }
        }}
        ref={pickerRef}
        className="color-picker-content"
        // to allow focusing by clicking but not by tabbing
        tabIndex={-1}
      >
        {!!customColors.length && (
          <div>
            <PickerHeading>
              {t("colorPicker.mostUsedCustomColors")}
            </PickerHeading>
            <CustomColorList
              color={color}
              colors={customColors}
              label={t("colorPicker.mostUsedCustomColors")}
              onChange={onChange}
            />
          </div>
        )}

        <div>
          <PickerHeading>{t("colorPicker.colors")}</PickerHeading>
          <PickerColorList
            activeShade={activeShade}
            color={color}
            label={label}
            onChange={onChange}
            palette={palette}
          />
        </div>

        <div>
          <PickerHeading>{t("colorPicker.shades")}</PickerHeading>
          <ShadeList hex={color} onChange={onChange} palette={palette} />
        </div>
        {children}
      </div>
    </div>
  );
};
