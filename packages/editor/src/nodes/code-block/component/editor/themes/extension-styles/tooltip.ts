import { CodeBlockThemeSettings, ExtensionStyles } from "../base";

/**
 * Returns the styles for the tooltip extension
 * @param settings Theme settings
 */
export const get_tooltip_extension_styles = (
  settings: CodeBlockThemeSettings
): ExtensionStyles => ({
  /* eslint-disable prefer-snakecase/prefer-snakecase */
  "& .cm-tooltip": {
    "& > ul": {
      "& li[aria-selected]": {
        background: "var(--storiny-palette-primary-softActiveBg) !important"
      },
      "&::-webkit-scrollbar-thumb": { borderRadius: "5px" }
    },
    backdropFilter: "blur(15px)",
    backgroundColor: settings.tooltip_background,
    border: "1px solid var(--storiny-palette-divider)",
    borderRadius: "3px",
    color: "var(--storiny-palette-text-primary)",
    overflow: "hidden"
  }
  /* eslint-enable prefer-snakecase/prefer-snakecase */
});
