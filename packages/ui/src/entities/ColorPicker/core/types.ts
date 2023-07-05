export type RGB = { b: number; g: number; r: number };
export type HSV = { h: number; s: number; v: number };
export type HSL = { h: number; l: number; s: number };
export type HEX = string;

export type RGBA = RGB & { a: number };
export type HSVA = HSV & { a: number };

export type TColor = HSVA &
  RGBA & { [others: string]: number | string; hex: string; str: string };

export interface ColorState {
  /**
   * Color value
   */
  color: TColor;
  /**
   * Returns solid hex color value
   */
  getSolidColor: () => string;
  /**
   * Rotates alpha value
   * @param amount Amount to rotate by
   */
  rotateA: (amount: number) => void;
  /**
   * Rotates hue value
   * @param amount Amount to rotate by
   */
  rotateH: (amount: number) => void;
  /**
   * Rotates saturation value
   * @param amount Amount to rotate by
   */
  rotateS: (amount: number) => void;
  /**
   * Rotates value
   * @param amount Amount to rotate by
   */
  rotateV: (amount: number) => void;
  /**
   * Sets alpha value
   * @param a New value
   */
  setA: (a: number) => void;
  /**
   * Sets blue value
   * @param b New value
   */
  setB: (b: number) => void;
  /**
   * Sets green value
   * @param g New value
   */
  setG: (g: number) => void;
  /**
   * Sets hue value
   * @param h New value
   */
  setH: (h: number) => void;
  /**
   * Sets hex value
   * @param hex New value
   */
  setHex: (hex: string) => void;
  /**
   * Sets red value
   * @param r New value
   */
  setR: (r: number) => void;
  /**
   * Sets saturation value
   * @param s New value
   */
  setS: (s: number) => void;
  /**
   * Sets saturation and value
   * @param s New saturation
   * @param v New value
   */
  setSV: (s: number, v: number) => void;
  /**
   * Sets value
   * @param v New value
   */
  setV: (v: number) => void;
  /**
   * Stringify the color object
   */
  toString: () => string;
}
