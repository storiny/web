import clsx from "clsx";
import { useAtom } from "jotai";
import { useEffect, useRef } from "react";

import { ColorPaletteCustom } from "../../../lib/color/colors";
import { t } from "../../i18n";
import {
  activeColorPickerSectionAtom,
  colorPickerHotkeyBindings,
  getColorNameAndShadeFromColor
} from "./colorPickerUtils";
import HotkeyLabel from "./HotkeyLabel";

interface PickerColorListProps {
  activeShade: number;
  color: string;
  label: string;
  onChange: (color: string) => void;
  palette: ColorPaletteCustom;
}

const PickerColorList = ({
  palette,
  color,
  onChange,
  label,
  activeShade
}: PickerColorListProps) => {
  const colorObj = getColorNameAndShadeFromColor({
    color: color || "transparent",
    palette
  });
  const [activeColorPickerSection, setActiveColorPickerSection] = useAtom(
    activeColorPickerSectionAtom
  );

  const btnRef = useRef<HTMLButtonLayer>(null);

  useEffect(() => {
    if (btnRef.current && activeColorPickerSection === "baseColors") {
      btnRef.current.focus();
    }
  }, [colorObj?.colorName, activeColorPickerSection]);

  return (
    <div className="color-picker-content--default">
      {Object.entries(palette).map(([key, value], index) => {
        const color =
          (Array.isArray(value) ? value[activeShade] : value) || "transparent";

        const keybinding = colorPickerHotkeyBindings[index];
        const label = t(`colors.${key.replace(/\d+/, "")}`, null, "");

        return (
          <button
            aria-label={`${label} — ${keybinding}`}
            className={clsx(
              "color-picker__button color-picker__button--large",
              {
                active: colorObj?.colorName === key,
                "is-transparent": color === "transparent" || !color
              }
            )}
            data-testid={`color-${key}`}
            key={key}
            onClick={() => {
              onChange(color);
              setActiveColorPickerSection("baseColors");
            }}
            ref={colorObj?.colorName === key ? btnRef : undefined}
            style={color ? { "--swatch-color": color } : undefined}
            tabIndex={-1}
            title={`${label}${
              color.startsWith("#") ? ` ${color}` : ""
            } — ${keybinding}`}
            type="button"
          >
            <div className="color-picker__button-outline" />
            <HotkeyLabel color={color} keyLabel={keybinding} />
          </button>
        );
      })}
    </div>
  );
};

export default PickerColorList;
