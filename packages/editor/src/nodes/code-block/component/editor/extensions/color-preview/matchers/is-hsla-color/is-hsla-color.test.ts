import { is_hsla_color } from "./is-hsla-color";

const VALID_COLOR_VALUES = [
  "hsl(.9deg, .99%, -.999% )",
  "hsl(-.9deg, .99%, -.999% )",
  "HSLa(240Deg, 100%, 50%)",
  "hsl(.9, .99%, -.999% )",
  "hsl(240, 100%, 50% )",
  "hsl(240, 100%, 50%, 0.1)",
  "hsl(240, 100%, 50%, 10%)",
  "hsl(240,100%,50%,0.1)",
  "hsl(180deg, 100%, 50%, 0.1)",
  "hsl(3.14rad, 100%, 50%, 0.1)",
  "hsl(200grad, 100%, 50%, 0.1)",
  "hsl(0.5turn, 100%, 50%, 0.1)",
  "hsl(-240, -100%, -50%, -0.1)",
  "hsl(+240, +100%, +50%, +0.1)",
  "hsl(240.5, 99.99%, 49.999%, 0.9999)",
  "hsl(.9, .99%, .999%, .9999)",
  "hsl(0240, 0100%, 0050%, 01)",
  "hsl(240.0, 100.00%, 50.000%, 1.0000)",
  "hsl(2400, 1000%, 1000%, 10)",
  "hsl(-2400.01deg, -1000.5%, -1000.05%, -100)",
  "hsl(2.40e+2, 1.00e+2%, 5.00e+1%, 1E-3)",
  "hsl(2.40e+2, 1.00e+2%, 5.00e+1%, 1E-3%)",
  // Space separated (CSS color level 4)
  "hsl(240 100% 50%)",
  "hsl(240 100% 50% / 0.1)",
  "hsla(240, 100%, 50%)",
  "hsla(240, 100%, 50%, 0.1)",
  "HSL(240Deg, 100%, 50%)"
];

const INVALID_COLOR_VALUES = [
  "hsl()",
  "hsl()",
  'hsl("")',
  'hsl(".343")',
  'hsl("~~~~")',
  "hsl(240, 100%, 50%, 23x)",
  "hsl(.9 .99% .999%/ )",
  "hsl(.9 .99% .999%/ - )",
  "hsl(240, 100%, 50%, - )",
  "hsl(240, 100%, 50%,- )",
  "hsl(.9 .99% .999%, )",
  "hsl(.9, .99% .999% )",
  "hsla(.9, .99% .999% )",
  "hsl(+ .9deg, .99%, -.999% )"
];

describe("is_hsla_color", () => {
  it.each(VALID_COLOR_VALUES)(
    "returns `true` for valid HSL(A) color string (`%s`)",
    (str) => {
      expect(is_hsla_color(str)).toBeTrue();
    }
  );

  it.each(INVALID_COLOR_VALUES)(
    "returns `false` for invalid HSL(A) color string (`%s`)",
    (str) => {
      expect(is_hsla_color(str)).toBeFalse();
    }
  );
});
