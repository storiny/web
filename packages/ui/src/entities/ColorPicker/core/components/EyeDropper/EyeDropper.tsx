"use client";

import React from "react";
import useEyeDropper from "use-eye-dropper";

import IconButton from "~/components/IconButton";
import Tooltip from "~/components/Tooltip";
import { cssColor } from "~/entities/ColorPicker/core/color/cssColor";
import PickerIcon from "~/icons/Picker";

import { EyeDropperProps } from "./EyeDropper.props";

const EyeDropper = (props: EyeDropperProps): React.ReactElement => {
  const { state } = props;
  const { open, isSupported } = useEyeDropper();

  const pickColor = React.useCallback(() => {
    (async (): Promise<void> => {
      try {
        const color = await open();
        const parsedColor = cssColor(color.sRGBHex);

        if (parsedColor) {
          state.setR(parsedColor.r);
          state.setG(parsedColor.g);
          state.setB(parsedColor.b);
        }
      } catch (e) {
        // noop
      }
    })();
  }, [open, state]);

  return (
    <Tooltip
      content={
        isSupported() ? "Pick from screen" : "Unavailable on this browser"
      }
    >
      <span>
        <IconButton
          aria-label={"Pick a color from the screen"}
          disabled={!isSupported()}
          onClick={pickColor}
          variant={"ghost"}
        >
          <PickerIcon />
        </IconButton>
      </span>
    </Tooltip>
  );
};

export default EyeDropper;
