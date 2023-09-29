import { is_hex_color } from "./is-hex-color";

const VALID_COLORS = [
  // 8 digit (alpha)
  "#afebe300",
  "#AFEBE3AA",
  "#3cb371ff",
  "#3CB371CC",
  "#556b2f55",
  // 6 digit
  "#afebe3",
  "#AFEBE3",
  "#3cb371",
  "#3CB371",
  "#556b2f",
  "#556B2F",
  "#708090",
  "#7b68ee",
  "#7B68EE",
  "#eeeeee",
  "#ffffff",
  "#123fff",
  "#111111",
  // 4 digit
  "#afe0",
  "#AF31",
  "#3cba",
  "#3CBA",
  "#b2ff",
  "#5B2F",
  // 3 digit
  "#afe",
  "#AF3",
  "#3cb",
  "#3CB",
  "#b2f",
  "#5B2",
  "#708",
  "#68e",
  "#7AF",
  "#777",
  "#FFF",
  "#fff",
  "#f3f",
  "#111"
];

const INVALID_COLORS = [
  // 8 digit (alpha)
  "afebe300",
  "AFEBE3AA",
  "#3cb371fg",
  "#3CB371xy",
  "#556b2fz9",
  // 6 digit
  "afebe3",
  "AFEBE3",
  "3cb371",
  "ABC371",
  "556b2f",
  "5A6B2F",
  "708090",
  "7b68ee",
  "7B68EE",
  "eeeeee",
  "ffffff",
  "111111",
  "afebef",
  "3c537f",
  "556B2f",
  "708135",
  "EE3EF1",
  "7f68ZY",
  "#7f68ZY",
  "#7z68ZY",
  "#GR68",
  "#Z68",
  "#666EFR",
  // 4 digit
  "afe0",
  "AF31",
  "#3cbg",
  "#3CBy",
  "#b2fz",
  // 3 digit
  "fff",
  "4zy",
  "4g1",
  "111",
  "Ge3",
  "zY1",
  "#ggg",
  "#4zy",
  "#4g1",
  "#Ge3",
  "#zY1",
  // Misc
  "#123fff}",
  "foo #ae3f4c bar",
  "#f3f}",
  "foo #e7f bar",
  "#123fff00}",
  "foo #ae3f4cff bar",
  "#f3f0}",
  "foo #e7ff bar"
];

describe("is_hex_color", () => {
  VALID_COLORS.forEach((color) => {
    it(`returns true for valid color \`${color}\``, () => {
      expect(is_hex_color(color)).toBeTrue();
    });
  });

  INVALID_COLORS.forEach((color) => {
    it(`returns false for invalid color \`${color}\``, () => {
      expect(is_hex_color(color)).toBeFalse();
    });
  });
});
