import React from "react";

import { SV_MAX } from "../../color/constants";
import { Key } from "../../keys";
import { useSlider } from "../useSlider";
import { UseColorBoardProps } from "./useColorBoard.props";

/**
 * Default aria strings
 */
const ariaStrings = {
  ariaLabel: "Saturation and brightness",
  ariaValueFormat: "Saturation {0} brightness {1}",
  ariaDescription:
    "Use left and right arrow keys to set saturation. Use up and down arrow keys to set brightness."
};

/**
 * Hook for color board
 * @param props
 */
export const useColorBoard = (
  props: UseColorBoardProps
): {
  containerProps: React.HTMLAttributes<HTMLElement>;
  descriptionProps: React.HTMLAttributes<HTMLElement>;
} => {
  const {
    state,
    ref,
    ariaDescription = ariaStrings.ariaDescription,
    ariaLabel = ariaStrings.ariaLabel,
    ariaValueFormat = ariaStrings.ariaValueFormat
  } = props;
  const boardId = React.useId();
  const descriptionId = React.useId();
  const isAdjustingSaturation = React.useRef<boolean>(false);
  const color = state.color;

  const valueText = ariaValueFormat
    .replace("{0}", String(color.s))
    .replace("{1}", String(color.v));

  const { sliderProps } = useSlider({
    ref,
    maxValue: SV_MAX,
    direction: "both",
    ariaLabel,
    ariaValueText: valueText,
    ariaValueNow: isAdjustingSaturation.current ? color.s : color.v,
    onChange: ({ x: s, y: v }) => {
      v = SV_MAX - v;
      state.setSV(s, v);
    }
  });

  const onKeyDown = (event: React.KeyboardEvent): void => {
    // Allow users to tab out. Don't prevent default if Tab is pressed
    if (event.key !== Key.Tab) {
      event.preventDefault();
    }

    const increment = event.shiftKey ? 10 : 1;

    switch (event.key) {
      case Key.ArrowUp:
        isAdjustingSaturation.current = false;
        state.rotateV(increment);
        break;
      case Key.ArrowDown:
        isAdjustingSaturation.current = false;
        state.rotateV(-increment);
        break;
      case Key.ArrowLeft:
        isAdjustingSaturation.current = true;
        state.rotateS(-increment);
        break;
      case Key.ArrowRight:
        isAdjustingSaturation.current = true;
        state.rotateS(increment);
        break;
      case Key.Home:
        isAdjustingSaturation.current = true;
        state.setS(0);
        break;
      case Key.End:
        isAdjustingSaturation.current = true;
        state.setS(SV_MAX);
        break;
      case Key.PageUp:
        isAdjustingSaturation.current = false;
        state.setV(SV_MAX);
        break;
      case Key.PageDown:
        isAdjustingSaturation.current = false;
        state.setV(0);
        break;
    }
  };

  return {
    containerProps: {
      ...sliderProps,
      onKeyDown,
      "aria-describedby": descriptionId,
      id: boardId
    },
    descriptionProps: {
      id: descriptionId,
      children: ariaDescription
    }
  };
};
