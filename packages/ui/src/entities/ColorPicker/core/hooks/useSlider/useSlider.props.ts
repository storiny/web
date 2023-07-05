import React from "react";

type Direction =
  | {
      direction?: "horizontal" | "vertical";
      onChange?: (value: number) => void;
    }
  | {
      direction?: "both";
      onChange?: ({ x, y }: { x: number; y: number }) => void;
    };

export type UseSliderProps = Direction & {
  ariaLabel?: string;
  ariaValueNow?: number;
  ariaValueText?: string;
  /**
   * Big step value used when stepping using the shift key
   */
  bigStep?: number;
  /**
   * Maximum value of slider
   */
  maxValue?: number;
  /**
   * Minimum value of slider
   */
  minValue?: number;
  /**
   * Callback function called on stepping
   * @param amount Step amount
   */
  onStep?: (amount: number) => void;
  /**
   * Slider ref
   */
  ref: React.RefObject<HTMLElement>;
  /**
   * Default step value
   */
  step?: number;
};
