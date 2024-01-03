import type { Extension } from "@codemirror/state";
import { gutter, GutterMarker } from "@codemirror/view";

class EmptyMarker extends GutterMarker {
  toDOM(): Text {
    return document.createTextNode("ø");
  }
}

const empty_marker = new EmptyMarker();

export const empty_gutter_extension: () => Extension = () =>
  gutter({
    class: "cm-emptyLines",
    initialSpacer: () => empty_marker,
    lineMarker: (view, line) => (line.from == line.to ? empty_marker : null)
  });
