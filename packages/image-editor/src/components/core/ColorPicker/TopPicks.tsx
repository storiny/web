import clsx from "clsx";

import {
  DEFAULT_CANVAS_BACKGROUND_PICKS,
  DEFAULT_ELEMENT_BACKGROUND_PICKS,
  DEFAULT_ELEMENT_STROKE_PICKS
} from "../../../lib/color/colors";
import { ColorPickerType } from "./colorPickerUtils";

interface TopPicksProps {
  activeColor: string;
  onChange: (color: string) => void;
  topPicks?: readonly string[];
  type: ColorPickerType;
}

export const TopPicks = ({
  onChange,
  type,
  activeColor,
  topPicks
}: TopPicksProps) => {
  let colors;
  if (type === "layerStroke") {
    colors = DEFAULT_ELEMENT_STROKE_PICKS;
  }

  if (type === "layerBackground") {
    colors = DEFAULT_ELEMENT_BACKGROUND_PICKS;
  }

  if (type === "canvasBackground") {
    colors = DEFAULT_CANVAS_BACKGROUND_PICKS;
  }

  // this one can overwrite defaults
  if (topPicks) {
    colors = topPicks;
  }

  if (!colors) {
    console.error("Invalid type for TopPicks");
    return null;
  }

  return (
    <div className="color-picker__top-picks">
      {colors.map((color: string) => (
        <button
          className={clsx("color-picker__button", {
            active: color === activeColor,
            "is-transparent": color === "transparent" || !color
          })}
          key={color}
          onClick={() => onChange(color)}
          style={{ "--swatch-color": color }}
          title={color}
          type="button"
        >
          <div className="color-picker__button-outline" />
        </button>
      ))}
    </div>
  );
};
