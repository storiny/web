import React from "react";

type Direction =
  | {
      direction?: "horizontal" | "vertical";
      on_change?: (value: number) => void;
    }
  | {
      direction?: "both";
      on_change?: ({ x, y }: { x: number; y: number }) => void;
    };

export type UseSliderProps = Direction & {
  aria_label?: string;
  aria_value_now?: number;
  aria_value_text?: string;
  /**
   * Big step value used when stepping using the shift key
   * @default 10
   */
  big_step?: number;
  /**
   * Maximum value of slider
   * @default 100
   */
  max_value?: number;
  /**
   * Minimum value of slider
   * @default 0
   */
  min_value?: number;
  /**
   * Callback function called on stepping
   * @param amount Step amount
   */
  on_step?: (amount: number) => void;
  /**
   * Slider ref
   */
  ref: React.RefObject<HTMLElement>;
  /**
   * Default step value
   * @default 1
   */
  step?: number;
};
