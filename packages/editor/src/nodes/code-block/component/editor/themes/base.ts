import {
  HighlightStyle,
  syntaxHighlighting as syntax_highlighting,
  TagStyle
} from "@codemirror/language";
import type { Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import type { StyleSpec } from "style-mod";

import { auto_link_extension_styles } from "./extension-styles/auto-link";
import { gutter_extension_styles } from "./extension-styles/gutter";
import { tooltip_extension_styles } from "./extension-styles/tooltip";

export type CodeBlockThemeMode = "light" | "dark";
export type ExtensionStyles = Record<string, StyleSpec>;

export interface ExtendCodeBlockThemeOptions {
  mode: CodeBlockThemeMode;
  read_only: boolean;
  styles: TagStyle[];
}

/**
 * Utility function to create code block themes
 * @param mode The mode of the theme
 * @param settings The theme settings
 * @param styles The theme styles object
 * @param read_only The read-only flag
 */
export const extend_code_block_theme = ({
  mode,
  styles,
  read_only
}: ExtendCodeBlockThemeOptions): Extension => {
  const theme_options: ExtensionStyles = {
    /* eslint-disable prefer-snakecase/prefer-snakecase */
    "&": {
      fontSize: "13px",
      backgroundColor: "var(--bg-body)",
      color: "var(--fg-major)",
      outline: "none"
    },
    "& .cm-activeLineGutter": {
      backgroundColor: "transparent"
    },
    "& .cm-content": {
      caretColor: "var(--fg-major)",
      paddingInline: "8px"
    },
    "& .cm-cursor, .cm-dropCursor": {
      borderLeftColor: "var(--fg-major)"
    },
    "& .cm-foldMarker": {
      filter: mode === "dark" ? "invert(1)" : "none"
    },
    "& .cm-foldPlaceholder": {
      "&:hover": {
        "&:active": {
          backgroundColor: "var(--bg-elevation-lg)"
        },
        backgroundColor: "var(--bg-elevation-md)",
        color: "var(--fg-major)"
      },
      backgroundColor: "var(--bg-elevation-sm)",
      border: "1px solid var(--divider)",
      color: "var(--fg-minor)",
      padding: "0 5px"
    },
    "& .cm-gutters": {
      "&:after": {
        borderRight: "1px solid var(--divider)",
        content: '""',
        position: "absolute",
        width: "calc(100% + 1px)",
        height: "calc(100% + 12px)",
        top: "-6px",
        zIndex: -1,
        opacity: 0.75
      },
      backgroundColor: "var(--bg-body)",
      border: "none"
    },
    "& .cm-scroller": {
      fontFamily: "var(--font-code, var(--font-monospace)) !important",
      outline: "none",
      padding: "6px 0",
      "&::-webkit-scrollbar": {
        height: "10px"
      },
      "&::-webkit-scrollbar-thumb": {
        border: "2px solid var(--inverted-50)",
        borderRadius: "var(--radius-lg)",
        backgroundColor: "var(--inverted-200)",
        "&:hover": {
          backgroundColor: "var(--inverted-400)"
        }
      },
      "&::-webkit-scrollbar-track": {
        backgroundColor: "var(--inverted-50)",
        borderTop: "1px solid var(--divider)",
        boxShadow: "none"
      }
    },
    "&.cm-focused": {
      "& .cm-selectionBackground, ::selection": {
        backgroundColor: "var(--bg-selection) !important"
      },
      "& .cm-selectionMatch, & .cm-matchingBracket": {
        backgroundColor: "var(--inverted-50)",
        borderRadius: "var(--radius-xs)",
        outline: "1px solid var(--inverted-300)"
      },
      outline: "none !important"
    },
    "&:not(.cm-focused)": {
      "& .cm-selectionMatch, & .cm-matchingBracket": {
        backgroundColor: "transparent"
      },
      "& .cm-selectionBackground, ::selection": {
        backgroundColor: `${
          !read_only ? "transparent" : "var(--bg-selection)"
        } !important`
      }
    },
    ...auto_link_extension_styles,
    ...gutter_extension_styles,
    ...tooltip_extension_styles
    /* eslint-enable prefer-snakecase/prefer-snakecase */
  };

  const theme_ext = EditorView.theme(theme_options, {
    dark: mode === "dark"
  });

  return [theme_ext, syntax_highlighting(HighlightStyle.define(styles))];
};
