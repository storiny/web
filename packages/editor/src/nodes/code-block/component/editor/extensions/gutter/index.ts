import { foldGutter as fold_gutter } from "@codemirror/language";
import { Extension } from "@codemirror/state";
import {
  highlightActiveLineGutter as highlight_active_line_gutter,
  lineNumbers as line_numbers
} from "@codemirror/view";

import { empty_gutter_extension } from "../empty-gutter";

export const gutter_extensions: Extension[] = [
  line_numbers(),
  highlight_active_line_gutter(),
  fold_gutter({
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    markerDOM: (open) => {
      const marker = document.createElement("span");
      marker.className = "cm-foldMarker";
      marker.dataset["open"] = String(open);

      return marker;
    }
  }),
  empty_gutter_extension()
];
