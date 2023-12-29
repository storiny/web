import { syntaxTree as syntax_tree } from "@codemirror/language";
import type { Extension, Range, RangeSet } from "@codemirror/state";
import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
  WidgetType
} from "@codemirror/view";
import named_colors from "color-name";

import { is_hsla_color, is_rgba_color } from "./matchers";
import styles from "./styles.module.scss";

export interface ColorState {
  color: string;
  from: number;
  to: number;
}

class ColorWidget extends WidgetType {
  /**
   * Ctor
   * @param state
   */
  constructor(state: ColorState) {
    super();
    this.state = state;
  }

  /**
   * The color state
   * @private
   */
  private readonly state: ColorState;

  public eq(other: ColorWidget): boolean {
    return (
      other.state.from === this.state.from &&
      other.state.to === this.state.to &&
      other.state.color === this.state.color
    );
  }

  public toDOM(): HTMLElement {
    const element = document.createElement("span");
    element.className = styles["color-preview"];
    element.ariaHidden = "true";
    element.style.setProperty("--color", this.state.color);

    return element;
  }

  public ignoreEvent(): boolean {
    return false;
  }
}

const color_decorations = (view: EditorView): RangeSet<Decoration> => {
  const decorations: Array<Range<Decoration>> = [];

  for (const range of view.visibleRanges) {
    syntax_tree(view.state).iterate({
      enter: ({ type, from, to }) => {
        const call_exp = view.state.doc.sliceString(from, to);

        if (
          (type.name === "CallExpression" &&
            (is_rgba_color(call_exp) || is_hsla_color(call_exp))) ||
          type.name === "ColorLiteral"
        ) {
          const widget = Decoration.widget({
            side: 0,
            widget: new ColorWidget({
              color: call_exp,
              from,
              to
            })
          });

          decorations.push(widget.range(from));
        } else if (type.name === "ValueName") {
          if (call_exp in named_colors) {
            const color = named_colors[call_exp as keyof typeof named_colors];

            const widget = Decoration.widget({
              side: 0,
              widget: new ColorWidget({
                color: `rgb(${color[0]}, ${color[1]}, ${color[2]})`,
                from,
                to
              })
            });

            decorations.push(widget.range(from));
          }
        }
      },
      from: range.from,
      to: range.to
    });
  }

  return Decoration.set(decorations, true);
};

class ColorViewPluginValue {
  /**
   * Ctor
   * @param view
   */
  constructor(view: EditorView) {
    this.decorations = color_decorations(view);
  }

  /**
   * Decorations
   */
  public decorations: DecorationSet;

  public update(update: ViewUpdate): void {
    if (update.docChanged || update.viewportChanged) {
      this.decorations = color_decorations(update.view);
    }
  }
}

export const color_preview_extension: () => Extension = () =>
  ViewPlugin.fromClass(ColorViewPluginValue, {
    decorations: ({ decorations }) => decorations
  });
