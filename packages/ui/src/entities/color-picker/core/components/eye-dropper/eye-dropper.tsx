"use client";

import { dev_console } from "@storiny/shared/src/utils/dev-log";
import React from "react";
import use_eye_dropper from "use-eye-dropper";

import IconButton from "~/components/icon-button";
import Tooltip from "~/components/tooltip";
import { css_color } from "~/entities/color-picker/core/color/css-color";
import PickerIcon from "~/icons/picker";

import { EyeDropperProps } from "./eye-dropper.props";

const EyeDropper = (props: EyeDropperProps): React.ReactElement => {
  const { state } = props;
  const { open, isSupported } = use_eye_dropper();

  const pick_color = React.useCallback(() => {
    (async (): Promise<void> => {
      try {
        const color = await open();
        const parsed_color = css_color(color.sRGBHex);

        if (parsed_color) {
          state.set_r(parsed_color.r);
          state.set_g(parsed_color.g);
          state.set_b(parsed_color.b);
        }
      } catch (e) {
        dev_console.error(e);
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
          onClick={pick_color}
          variant={"ghost"}
        >
          <PickerIcon />
        </IconButton>
      </span>
    </Tooltip>
  );
};

export default EyeDropper;
