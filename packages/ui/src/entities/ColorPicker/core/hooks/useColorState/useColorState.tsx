import React from "react";

import { clamp } from "~/utils/clamp";

import { ALPHA_MAX, HUE_MAX, SV_MAX } from "../../color/constants";
import {
  hexToRgb,
  hsvToHex,
  hsvToRgb,
  rgbaToStr,
  rgbToHex,
  rgbToHsv
} from "../../color/converters";
import { isValidAlpha, isValidColor, isValidRGBValue } from "../../color/utils";
import { ColorState, RGB, TColor } from "../../types";
import { UseColorStateProps } from "./useColorState.props";

/**
 * Default initial color state
 */
const initalColor = {
  h: 0,
  s: 50,
  v: 50,
  a: 100,
  r: 128,
  g: 64,
  b: 64,
  hex: "804040",
  str: "#804040"
};

/**
 * Sets RGB color value
 * @param setValue Action dispatcher
 * @param channel Color channel
 * @param value Color value
 */
const setRGBValue = (
  setValue: React.Dispatch<React.SetStateAction<TColor>>,
  channel: "r" | "g" | "b",
  value: number
): void => {
  if (isValidRGBValue(value)) {
    setValue((prev) => {
      const { r, g, b, a }: TColor = { ...prev, [channel]: value };
      const { h, s, v } = rgbToHsv({ r, g, b });
      const hex = rgbToHex({ r, g, b }, false);
      const str = rgbaToStr({ r, g, b, a });

      return { r, g, b, a, h, s, v, hex, str };
    });
  }
};

/**
 * Sets HSV color value
 * @param setValue Action dispatcher
 * @param channel Color channel
 * @param value Color value
 * @param max Upper bound
 */
const setHSVValue = (
  setValue: React.Dispatch<React.SetStateAction<TColor>>,
  channel: "h" | "s" | "v",
  value: number,
  max: number = SV_MAX
): void => {
  if (isValidColor(value, max)) {
    setValue((prev) => {
      const { h, s, v, a }: TColor = { ...prev, [channel]: value };
      const { r, g, b } = hsvToRgb({ h, s, v });
      const hex = rgbToHex({ r, g, b }, false);
      const str = rgbaToStr({ r, g, b, a });

      return { h, s, v, r, g, b, a, hex, str };
    });
  }
};

/**
 * Rotates HSV color value
 * @param setValue Action dispatcher
 * @param channel Color channel
 * @param amount Rotation amount
 * @param max Upper bound
 */
const rotateHSVValue = (
  setValue: React.Dispatch<React.SetStateAction<TColor>>,
  channel: "h" | "s" | "v",
  amount: number,
  max: number = SV_MAX
): void => {
  setValue((prev) => {
    const { h, s, v, a }: TColor = {
      ...prev,
      [channel]: clamp(0, prev[channel] + amount, max)
    };
    const { r, g, b } = hsvToRgb({ h, s, v });
    const hex = rgbToHex({ r, g, b }, false);
    const str = rgbaToStr({ r, g, b, a });

    return { h, s, v, r, g, b, a, hex, str };
  });
};

/**
 * Hook for using color state
 * @param props
 */
export const useColorState = (props: UseColorStateProps): ColorState => {
  const { value, defaultValue, onChange } = props;
  const [color, setColorState] = React.useState<TColor>(
    defaultValue || initalColor
  );

  /**
   * Custom function for handling value updates
   * @param newValue New value
   */
  const setValue: typeof setColorState = (newValue) => {
    if (typeof onChange === "function") {
      if (typeof value !== "undefined") {
        onChange(typeof newValue === "function" ? newValue(color) : newValue);
        // If value is provided then it's controlled,
        // so stop excuting and don't update the internal state
        return;
      }

      onChange(typeof newValue === "function" ? newValue(color) : newValue);
    }

    setColorState(newValue);
  };

  // Set HSV
  const setH = (h: number): void => setHSVValue(setValue, "h", h, HUE_MAX);
  const setS = (s: number): void => setHSVValue(setValue, "s", s);
  const setV = (v: number): void => setHSVValue(setValue, "v", v);

  // Set SV
  const setSV = (s: number, v: number): void => {
    if (isValidColor(s, SV_MAX) && isValidColor(v, SV_MAX)) {
      setValue((prev) => {
        const { h, a } = prev;
        const { r, g, b } = hsvToRgb({ h, s, v });
        const hex = rgbToHex({ r, g, b }, false);
        const str = rgbaToStr({ r, g, b, a });

        return { h, s, v, r, g, b, a, hex, str };
      });
    }
  };

  // Set RGB
  const setR = (r: number): void => setRGBValue(setValue, "r", r);
  const setG = (g: number): void => setRGBValue(setValue, "g", g);
  const setB = (b: number): void => setRGBValue(setValue, "b", b);

  // Set alpha
  const setA = (a: number): void => {
    if (isValidAlpha(a)) {
      setValue((prev) => {
        const updated = { ...prev, a };
        updated.str = rgbaToStr(updated);

        return updated;
      });
    }
  };

  // Set hex color
  const setHex = (
    hex: string,
    fallback: RGB = { r: color.r, g: color.g, b: color.b }
  ): void => {
    setValue(({ a }) => {
      const { r, g, b } = hexToRgb(hex, fallback);
      const { h, s, v } = rgbToHsv({ r, g, b });
      const str = rgbaToStr({ r, g, b, a });

      return { r, g, b, h, s, v, hex, a, str };
    });
  };

  // Rotate HSV
  const rotateH = (amount: number): void =>
    rotateHSVValue(setValue, "h", amount, HUE_MAX);

  const rotateS = (amount: number): void =>
    rotateHSVValue(setValue, "s", amount);

  const rotateV = (amount: number): void =>
    rotateHSVValue(setValue, "v", amount);

  // Rotate alpha
  const rotateA = (amount: number): void => {
    setValue((prev) => ({
      ...prev,
      a: clamp(0, prev.a + amount, ALPHA_MAX)
    }));
  };

  React.useEffect(() => {
    if (value) {
      setColorState(value);
    }
  }, [value]);

  return {
    setH,
    setS,
    setV,
    setR,
    setG,
    setB,
    setA,
    setSV,
    setHex,
    rotateH,
    rotateS,
    rotateV,
    rotateA,
    color,
    getSolidColor: () => hsvToHex({ h: color.h, s: SV_MAX, v: SV_MAX })
  };
};
