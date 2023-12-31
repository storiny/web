import {
  defaultHighlightStyle as default_highlight_style,
  foldGutter as fold_gutter,
  syntaxHighlighting as syntax_highlighting
} from "@codemirror/language";
import { EditorState, Extension } from "@codemirror/state";
import {
  highlightActiveLineGutter as highlight_active_line_gutter,
  highlightSpecialChars as highlight_special_chars,
  lineNumbers as line_numbers
} from "@codemirror/view";

import { auto_link_extension } from "../auto-link";
import { color_preview_extension } from "../color-preview";
import { empty_gutter_extension } from "../empty-gutter";

// Maximum length of the code block content.
const MAX_LENGTH = 80_000;

export const common_extensions: Extension[] = [
  EditorState.changeFilter.of((tr) => tr.newDoc.length < MAX_LENGTH),
  line_numbers(),
  highlight_active_line_gutter(),
  highlight_special_chars(),
  fold_gutter({
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    markerDOM: (open) => {
      const marker = document.createElement("span");
      marker.className = "cm-foldMarker";
      marker.dataset["open"] = String(open);

      return marker;
    }
  }),
  color_preview_extension(),
  auto_link_extension(),
  empty_gutter_extension(),
  syntax_highlighting(default_highlight_style, { fallback: true })
];
