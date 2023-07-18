import clsx from "clsx";
import { useAtom } from "jotai";
import { useCallback, useEffect, useRef, useState } from "react";

import { getShortcutKey } from "../../../lib/utils/utils";
import { t } from "../../i18n";
import { jotaiScope } from "../../jotai";
import { KEYS } from "../../keys";
import { useDevice } from "../App";
import { activeEyeDropperAtom } from "../EyeDropper";
import { eyeDropperIcon } from "../icons";
import { getColor } from "./ColorPicker";
import { activeColorPickerSectionAtom } from "./colorPickerUtils";

interface ColorInputProps {
  color: string;
  label: string;
  onChange: (color: string) => void;
}

export const ColorInput = ({ color, onChange, label }: ColorInputProps) => {
  const device = useDevice();
  const [innerValue, setInnerValue] = useState(color);
  const [activeSection, setActiveColorPickerSection] = useAtom(
    activeColorPickerSectionAtom
  );

  useEffect(() => {
    setInnerValue(color);
  }, [color]);

  const changeColor = useCallback(
    (inputValue: string) => {
      const value = inputValue.toLowerCase();
      const color = getColor(value);

      if (color) {
        onChange(color);
      }
      setInnerValue(value);
    },
    [onChange]
  );

  const inputRef = useRef<HTMLInputLayer>(null);
  const eyeDropperTriggerRef = useRef<HTMLDivLayer>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [activeSection]);

  const [eyeDropperState, setEyeDropperState] = useAtom(
    activeEyeDropperAtom,
    jotaiScope
  );

  useEffect(
    () => () => {
      setEyeDropperState(null);
    },
    [setEyeDropperState]
  );

  return (
    <div className="color-picker__input-label">
      <div className="color-picker__input-hash">#</div>
      <input
        aria-label={label}
        className="color-picker-input"
        onBlur={() => {
          setInnerValue(color);
        }}
        onChange={(event) => {
          changeColor(event.target.value);
        }}
        onFocus={() => setActiveColorPickerSection("hex")}
        onKeyDown={(event) => {
          if (event.key === KEYS.TAB) {
            return;
          } else if (event.key === KEYS.ESCAPE) {
            eyeDropperTriggerRef.current?.focus();
          }
          event.stopPropagation();
        }}
        ref={activeSection === "hex" ? inputRef : undefined}
        spellCheck={false}
        style={{ border: 0, padding: 0 }}
        tabIndex={-1}
        value={(innerValue || "").replace(/^#/, "")}
      />
      {/* TODO reenable on mobile with a better UX */}
      {!device.isMobile && (
        <>
          <div
            style={{
              width: "1px",
              height: "1.25rem",
              backgroundColor: "var(--default-border-color)"
            }}
          />
          <div
            className={clsx("excalidraw-eye-dropper-trigger", {
              selected: eyeDropperState
            })}
            onClick={() =>
              setEyeDropperState((s) =>
                s
                  ? null
                  : {
                      keepOpenOnAlt: false,
                      onSelect: (color) => onChange(color)
                    }
              )
            }
            ref={eyeDropperTriggerRef}
            title={`${t(
              "labels.eyeDropper"
            )} — ${KEYS.I.toLocaleUpperCase()} or ${getShortcutKey("Alt")} `}
          >
            {eyeDropperIcon}
          </div>
        </>
      )}
    </div>
  );
};
