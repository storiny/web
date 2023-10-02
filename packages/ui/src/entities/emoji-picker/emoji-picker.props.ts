import React from "react";

import { PopoverProps } from "~/components/popover";

export interface EmojiPickerProps {
  /**
   * Trigger child
   */
  children?: React.ReactNode;
  /**
   * Callback function called when selecting an emoji
   */
  on_emoji_select?: ({
    native,
    unified
  }: {
    native: string;
    unified: string;
  }) => void;
  /**
   * Props passed to the Popover component
   */
  popover_props?: Partial<PopoverProps>;
}
