import "./ColorPicker.scss";

import * as Popover from "@radix-ui/react-popover";
import clsx from "clsx";
import { useAtom } from "jotai";
import { useRef } from "react";

import { jotaiScope } from "../../../core/jotai";
import { AppState } from "../../../core/types";
import {
  COLOR_PALETTE,
  ColorPaletteCustom,
  ColorTuple
} from "../../../lib/color/colors";
import {
  isInteractive,
  isTransparent,
  isWritableLayer
} from "../../../lib/utils/utils";
import { t } from "../../i18n";
import { ExcalidrawLayer } from "../../layer/types";
import { useDevice, useExcalidrawContainer } from "../App";
import { activeEyeDropperAtom } from "../EyeDropper";
import { ColorInput } from "./ColorInput";
import {
  activeColorPickerSectionAtom,
  ColorPickerType
} from "./colorPickerUtils";
import { Picker } from "./Picker";
import PickerHeading from "./PickerHeading";
import { TopPicks } from "./TopPicks";

const isValidColor = (color: string) => {
  const style = new Option().style;
  style.color = color;
  return !!style.color;
};

export const getColor = (color: string): string | null => {
  if (isTransparent(color)) {
    return color;
  }

  // testing for `#` first fixes a bug on Electron (more specfically, an
  // Obsidian popout window), where a hex color without `#` is (incorrectly)
  // considered valid
  return isValidColor(`#${color}`)
    ? `#${color}`
    : isValidColor(color)
    ? color
    : null;
};

interface ColorPickerProps {
  color: string;
  editorState: AppState;
  label: string;
  layers: readonly ExcalidrawLayer[];
  onChange: (color: string) => void;
  palette?: ColorPaletteCustom | null;
  topPicks?: ColorTuple;
  type: ColorPickerType;
  updateData: (formData?: any) => void;
}

const ColorPickerPopupContent = ({
  type,
  color,
  onChange,
  label,
  layers,
  palette = COLOR_PALETTE,
  updateData
}: Pick<
  ColorPickerProps,
  "type" | "color" | "onChange" | "label" | "layers" | "palette" | "updateData"
>) => {
  const [, setActiveColorPickerSection] = useAtom(activeColorPickerSectionAtom);

  const [eyeDropperState, setEyeDropperState] = useAtom(
    activeEyeDropperAtom,
    jotaiScope
  );

  const { container } = useExcalidrawContainer();
  const { isMobile, isLandscape } = useDevice();

  const colorInputJSX = (
    <div>
      <PickerHeading>{t("colorPicker.hexCode")}</PickerHeading>
      <ColorInput
        color={color}
        label={label}
        onChange={(color) => {
          onChange(color);
        }}
      />
    </div>
  );
  const popoverRef = useRef<HTMLDivLayer>(null);

  const focusPickerContent = () => {
    popoverRef.current
      ?.querySelector<HTMLDivLayer>(".color-picker-content")
      ?.focus();
  };

  return (
    <Popover.Portal container={container}>
      <Popover.Content
        align={isMobile && !isLandscape ? "center" : "start"}
        alignOffset={-16}
        className="focus-visible-none"
        data-prevent-outside-click
        onCloseAutoFocus={(e) => {
          e.stopPropagation();
          // prevents focusing the trigger
          e.preventDefault();

          // return focus to excalidraw container unless
          // user focuses an interactive layer, such as a button, or
          // enters the text editor by clicking on canvas with the text tool
          if (container && !isInteractive(document.activeLayer)) {
            container.focus();
          }

          updateData({ openPopup: null });
          setActiveColorPickerSection(null);
        }}
        onFocusOutside={(event) => {
          focusPickerContent();
          event.preventDefault();
        }}
        onPointerDownOutside={(event) => {
          if (eyeDropperState) {
            // prevent from closing if we click outside the popover
            // while eyedropping (e.g. click when clicking the sidebar;
            // the eye-dropper-backdrop is prevented downstream)
            event.preventDefault();
          }
        }}
        ref={popoverRef}
        side={isMobile && !isLandscape ? "bottom" : "right"}
        sideOffset={20}
        style={{
          zIndex: 9999,
          backgroundColor: "var(--popup-bg-color)",
          maxWidth: "208px",
          maxHeight: window.innerHeight,
          padding: "12px",
          borderRadius: "8px",
          boxSizing: "border-box",
          overflowY: "auto",
          boxShadow:
            "0px 7px 14px rgba(0, 0, 0, 0.05), 0px 0px 3.12708px rgba(0, 0, 0, 0.0798), 0px 0px 0.931014px rgba(0, 0, 0, 0.1702)"
        }}
      >
        {palette ? (
          <Picker
            color={color}
            label={label}
            layers={layers}
            onChange={(changedColor) => {
              onChange(changedColor);
            }}
            onEscape={(event) => {
              if (eyeDropperState) {
                setEyeDropperState(null);
              } else if (isWritableLayer(event.target)) {
                focusPickerContent();
              } else {
                updateData({ openPopup: null });
              }
            }}
            onEyeDropperToggle={(force) => {
              setEyeDropperState((state) => {
                if (force) {
                  state = state || {
                    keepOpenOnAlt: true,
                    onSelect: onChange
                  };
                  state.keepOpenOnAlt = true;
                  return state;
                }

                return force === false || state
                  ? null
                  : {
                      keepOpenOnAlt: false,
                      onSelect: onChange
                    };
              });
            }}
            palette={palette}
            type={type}
            updateData={updateData}
          >
            {colorInputJSX}
          </Picker>
        ) : (
          colorInputJSX
        )}
        <Popover.Arrow
          height={10}
          style={{
            fill: "var(--popup-bg-color)",
            filter: "drop-shadow(rgba(0, 0, 0, 0.05) 0px 3px 2px)"
          }}
          width={20}
        />
      </Popover.Content>
    </Popover.Portal>
  );
};

const ColorPickerTrigger = ({
  label,
  color,
  type
}: {
  color: string;
  label: string;
  type: ColorPickerType;
}) => (
  <Popover.Trigger
    aria-label={label}
    className={clsx("color-picker__button active-color", {
      "is-transparent": color === "transparent" || !color
    })}
    style={color ? { "--swatch-color": color } : undefined}
    title={
      type === "layerStroke"
        ? t("labels.showStroke")
        : t("labels.showBackground")
    }
    type="button"
  >
    <div className="color-picker__button-outline" />
  </Popover.Trigger>
);

export const ColorPicker = ({
  type,
  color,
  onChange,
  label,
  layers,
  palette = COLOR_PALETTE,
  topPicks,
  updateData,
  editorState
}: ColorPickerProps) => (
  <div>
    <div aria-modal="true" className="color-picker-container" role="dialog">
      <TopPicks
        activeColor={color}
        onChange={onChange}
        topPicks={topPicks}
        type={type}
      />
      <div
        style={{
          width: 1,
          height: "100%",
          backgroundColor: "var(--default-border-color)",
          margin: "0 auto"
        }}
      />
      <Popover.Root
        onOpenChange={(open) => {
          updateData({ openPopup: open ? type : null });
        }}
        open={editorState.openPopup === type}
      >
        {/* serves as an active color indicator as well */}
        <ColorPickerTrigger color={color} label={label} type={type} />
        {/* popup content */}
        {editorState.openPopup === type && (
          <ColorPickerPopupContent
            color={color}
            label={label}
            layers={layers}
            onChange={onChange}
            palette={palette}
            type={type}
            updateData={updateData}
          />
        )}
      </Popover.Root>
    </div>
  </div>
);
