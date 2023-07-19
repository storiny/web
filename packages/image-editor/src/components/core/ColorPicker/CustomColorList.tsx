import clsx from "clsx";
import { useAtom } from "jotai";
import { useEffect, useRef } from "react";

import { activeColorPickerSectionAtom } from "./colorPickerUtils";
import HotkeyLabel from "./HotkeyLabel";

interface CustomColorListProps {
  color: string;
  colors: string[];
  label: string;
  onChange: (color: string) => void;
}

export const CustomColorList = ({
  colors,
  color,
  onChange,
  label
}: CustomColorListProps) => {
  const [activeColorPickerSection, setActiveColorPickerSection] = useAtom(
    activeColorPickerSectionAtom
  );

  const btnRef = useRef<HTMLButtonLayer>(null);

  useEffect(() => {
    if (btnRef.current) {
      btnRef.current.focus();
    }
  }, [color, activeColorPickerSection]);

  return (
    <div className="color-picker-content--default">
      {colors.map((c, i) => (
        <button
          aria-label={label}
          className={clsx("color-picker__button color-picker__button--large", {
            active: color === c,
            "is-transparent": c === "transparent" || !c
          })}
          key={i}
          onClick={() => {
            onChange(c);
            setActiveColorPickerSection("custom");
          }}
          ref={color === c ? btnRef : undefined}
          style={{ "--swatch-color": c }}
          tabIndex={-1}
          title={c}
          type="button"
        >
          <div className="color-picker__button-outline" />
          <HotkeyLabel color={c} isCustomColor keyLabel={i + 1} />
        </button>
      ))}
    </div>
  );
};
