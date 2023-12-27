import {
  defaultHighlightStyle as default_highlight_style,
  foldGutter as fold_gutter,
  syntaxHighlighting as syntax_highlighting
} from "@codemirror/language";
import { Extension } from "@codemirror/state";
import {
  highlightSpecialChars as highlight_special_chars,
  lineNumbers as line_numbers
} from "@codemirror/view";

import { auto_link_extension } from "../auto-link";
// import { color_view } from "../color";
import { empty_gutter_extension } from "../empty-gutter";

export const common_extensions: Extension[] = [
  line_numbers(),
  highlight_special_chars(),
  fold_gutter({
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    markerDOM: (open) => {
      const marker = document.createElement("span");
      marker.className = "cm-fold-marker";
      marker.dataset["open"] = String(open);

      return marker;
    }
  }),
  // colorView(),
  auto_link_extension(),
  empty_gutter_extension(),
  syntax_highlighting(default_highlight_style, { fallback: true })
];
