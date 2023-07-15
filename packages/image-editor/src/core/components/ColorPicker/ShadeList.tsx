import clsx from "clsx";
import { useAtom } from "jotai";
import { useEffect, useRef } from "react";

import { ColorPaletteCustom } from "../../colors";
import { t } from "../../i18n";
import {
  activeColorPickerSectionAtom,
  getColorNameAndShadeFromColor
} from "./colorPickerUtils";
import HotkeyLabel from "./HotkeyLabel";

interface ShadeListProps {
  hex: string;
  onChange: (color: string) => void;
  palette: ColorPaletteCustom;
}

export const ShadeList = ({ hex, onChange, palette }: ShadeListProps) => {
  const colorObj = getColorNameAndShadeFromColor({
    color: hex || "transparent",
    palette
  });

  const [activeColorPickerSection, setActiveColorPickerSection] = useAtom(
    activeColorPickerSectionAtom
  );

  const btnRef = useRef<HTMLButtonLayer>(null);

  useEffect(() => {
    if (btnRef.current && activeColorPickerSection === "shades") {
      btnRef.current.focus();
    }
  }, [colorObj, activeColorPickerSection]);

  if (colorObj) {
    const { colorName, shade } = colorObj;

    const shades = palette[colorName];

    if (Array.isArray(shades)) {
      return (
        <div className="color-picker-content--default shades">
          {shades.map((color, i) => (
            <button
              aria-label="Shade"
              className={clsx(
                "color-picker__button color-picker__button--large",
                { active: i === shade }
              )}
              key={i}
              onClick={() => {
                onChange(color);
                setActiveColorPickerSection("shades");
              }}
              ref={
                i === shade && activeColorPickerSection === "shades"
                  ? btnRef
                  : undefined
              }
              style={color ? { "--swatch-color": color } : undefined}
              tabIndex={-1}
              title={`${colorName} - ${i + 1}`}
              type="button"
            >
              <div className="color-picker__button-outline" />
              <HotkeyLabel color={color} isShade keyLabel={i + 1} />
            </button>
          ))}
        </div>
      );
    }
  }

  return (
    <div
      className="color-picker-content--default"
      style={{ position: "relative" }}
      tabIndex={-1}
    >
      <button
        className="color-picker__button color-picker__button--large color-picker__button--no-focus-visible"
        tabIndex={-1}
        type="button"
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          fontSize: "0.75rem"
        }}
        tabIndex={-1}
      >
        {t("colorPicker.noShades")}
      </div>
    </div>
  );
};
