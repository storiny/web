import { ExtensionStyles } from "../base";

export const tooltip_extension_styles: ExtensionStyles = {
  /* eslint-disable prefer-snakecase/prefer-snakecase */
  "& .cm-tooltip": {
    "& > ul": {
      "& li[aria-selected]": {
        background: "var(--inverted-400) !important",
        color: "var(--inverted-negative) !important"
      },
      "&::-webkit-scrollbar-thumb": { borderRadius: "var(--radius-sm)" }
    },
    backgroundColor: "var(--bg-elevation-sm)",
    border: "1px solid var(--divider)",
    borderRadius: "var(--radius-sm)",
    color: "var(--fg-minor)",
    overflow: "hidden"
  }
  /* eslint-enable prefer-snakecase/prefer-snakecase */
};
