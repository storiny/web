import { ExtensionStyles } from "../base";

export const tooltip_extension_styles: ExtensionStyles = {
  /* eslint-disable prefer-snakecase/prefer-snakecase */
  "& .cm-tooltip": {
    "& > ul": {
      "& li": {
        fontFamily: "var(--font-code, var(--font-monospace))",
        fontSize: "12px",
        paddingBlock: "3px !important",
        borderRadius: "var(--radius-sm)",
        maxWidth: "calc(100% - 6px)",
        marginInline: "3px",
        "&:hover": {
          background: "var(--inverted-50) !important",
          color: "var(--fg-major)"
        },
        "&[aria-selected]": {
          background: "var(--inverted-400) !important",
          color: "var(--inverted-0) !important"
        },
        "&:first-of-type": {
          marginTop: "3px"
        },
        "&:last-of-type": {
          marginBottom: "3px"
        }
      }
    },
    backgroundColor: "var(--bg-elevation-xs)",
    boxShadow: "var(--shadow-sm)",
    border: "1px solid var(--divider)",
    borderRadius: "var(--radius-sm)",
    color: "var(--fg-minor)",
    overflow: "hidden"
  }
  /* eslint-enable prefer-snakecase/prefer-snakecase */
};
