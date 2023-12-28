import {
  HighlightStyle,
  syntaxHighlighting as syntax_highlighting,
  TagStyle
} from "@codemirror/language";
import type { Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import type { StyleSpec } from "style-mod";

import { auto_link_extension_styles } from "./extension-styles/auto-link";
import { get_gutter_extension_styles } from "./extension-styles/gutter";
import { get_tooltip_extension_styles } from "./extension-styles/tooltip";

export type CodeBlockThemeMode = "light" | "dark";
export type ExtensionStyles = Record<string, StyleSpec>;

export interface ExtendCodeBlockThemeOptions {
  mode: CodeBlockThemeMode;
  settings: CodeBlockThemeSettings;
  styles: TagStyle[];
}

export interface CodeBlockThemeSettings {
  active_line_background: string;
  background: string;
  caret: string;
  fold_marker_filter: string;
  fold_placeholder: {
    active: {
      background: string;
      color: string;
    };
    background: string;
    color: string;
    hover: {
      background: string;
      color: string;
    };
  };
  font_family?: string;
  foreground: string;
  line_numbers: {
    active_color: string;
    active_shadow: string;
    color: string;
  };
  selection: {
    color: string;
    match_color: string;
    match_outline: string;
  };
  tooltip_background: string;
}

/**
 * Utility function to create code block themes
 * @param mode The mode of the theme
 * @param settings The theme settings
 * @param styles The theme styles object
 */
export const extend_code_block_theme = ({
  mode,
  settings,
  styles
}: ExtendCodeBlockThemeOptions): Extension => {
  const theme_options: ExtensionStyles = {
    /* eslint-disable prefer-snakecase/prefer-snakecase */
    "&": {
      fontSize: "14px",
      backgroundColor: settings.background,
      color: settings.foreground,
      outline: "none",
      transition: "box-shadow 250ms ease"
    },
    "& .cm-activeLine": {
      backgroundColor: "transparent"
    },
    "& .cm-activeLineGutter": {
      backgroundColor: "transparent"
    },
    "& .cm-content": {
      caretColor: settings.caret
    },
    "& .cm-cursor, .cm-dropCursor": {
      borderLeftColor: settings.caret
    },
    "& .cm-fold-marker": {
      filter: settings.fold_marker_filter
    },
    "& .cm-foldPlaceholder": {
      "&:hover": {
        "&:active": {
          backgroundColor: settings.fold_placeholder.active.background,
          color: settings.fold_placeholder.active.color
        },
        backgroundColor: settings.fold_placeholder.hover.background,
        color: settings.fold_placeholder.hover.color
      },
      backgroundColor: settings.fold_placeholder.background,
      border: "none",
      color: settings.fold_placeholder.color,
      padding: "0 5px",
      transition: "all 150ms ease"
    },
    "& .cm-gutters": {
      "&:after": {
        backgroundImage: `linear-gradient(
            to right,
            var(--storiny-palette-background-body) 80%,
            transparent
        )`,
        content: '""',
        height: "100%",
        position: "absolute",
        width: "calc(100% + 6px)",
        zIndex: -1
      },
      backgroundColor: "transparent",
      border: "none"
    },
    "& .cm-scroller": {
      "&::-webkit-scrollbar": {
        height: "8px"
      },
      "&::-webkit-scrollbar-thumb": {
        borderRadius: "8px",
        boxShadow: "inset 0 0 3px var(--storiny-palette-divider)"
      },
      "&::-webkit-scrollbar-track": {
        backgroundColor: "var(--storiny-palette-background-level1)",
        borderRadius: "0 0 8px 8px",
        borderTop:
          "1px solid rgba(var(--storiny-palette-neutral-mainChannel) / 15%)",
        boxShadow: "none"
      },
      outline: "none",
      padding: "8px 0"
    },
    "&.cm-focused": {
      "& .cm-activeLine": {
        backgroundColor: settings.active_line_background
      },
      "& .cm-selectionBackground, & .cm-selectionLayer .cm-selectionBackground, .cm-content ::selection":
        {
          backgroundColor: settings.selection.color
        },
      "& .cm-selectionMatch, & .cm-matchingBracket": {
        backgroundColor: settings.selection.match_color,
        borderRadius: "3px",
        outline: `2px solid ${settings.selection.match_outline}`,
        outlineOffset: "-1px"
      },
      outline: "none !important"
    },
    "&:not(.cm-focused)": {
      "& .cm-selectionMatch, & .cm-matchingBracket": {
        backgroundColor: "transparent"
      }
    },
    ...auto_link_extension_styles,
    ...get_gutter_extension_styles(settings),
    ...get_tooltip_extension_styles(settings)
    /* eslint-enable prefer-snakecase/prefer-snakecase */
  };

  const theme_ext = EditorView.theme(theme_options, {
    dark: mode === "dark"
  });

  return [theme_ext, syntax_highlighting(HighlightStyle.define(styles))];
};
