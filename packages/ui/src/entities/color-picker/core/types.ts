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
  get_solid_color: () => string;
  /**
   * Rotates alpha value
   * @param amount Amount to rotate by
   */
  rotate_a: (amount: number) => void;
  /**
   * Rotates hue value
   * @param amount Amount to rotate by
   */
  rotate_h: (amount: number) => void;
  /**
   * Rotates saturation value
   * @param amount Amount to rotate by
   */
  rotate_s: (amount: number) => void;
  /**
   * Rotates value
   * @param amount Amount to rotate by
   */
  rotate_v: (amount: number) => void;
  /**
   * Sets alpha value
   * @param a New value
   */
  set_a: (a: number) => void;
  /**
   * Sets blue value
   * @param b New value
   */
  set_b: (b: number) => void;
  /**
   * Sets green value
   * @param g New value
   */
  set_g: (g: number) => void;
  /**
   * Sets hue value
   * @param h New value
   */
  set_h: (h: number) => void;
  /**
   * Sets hex value
   * @param hex New value
   */
  set_hex: (hex: string) => void;
  /**
   * Sets red value
   * @param r New value
   */
  set_r: (r: number) => void;
  /**
   * Sets saturation value
   * @param s New value
   */
  set_s: (s: number) => void;
  /**
   * Sets saturation and value
   * @param s New saturation
   * @param v New value
   */
  set_sv: (s: number, v: number) => void;
  /**
   * Sets value
   * @param v New value
   */
  set_v: (v: number) => void;
  /**
   * Stringify the color object
   */
  toString: () => string;
}
