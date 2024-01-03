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

export interface AutoLinkState {
  from: number;
  to: number;
  url: string;
}

class AutoLink extends WidgetType {
  /**
   * Ctor
   * @param state
   */
  constructor(state: AutoLinkState) {
    super();
    this.state = state;
  }

  /**
   * The widget state
   * @private
   */
  private readonly state: AutoLinkState;

  public eq(other: AutoLink): boolean {
    return (
      this.state.url === other.state.url &&
      this.state.to === other.state.to &&
      this.state.from === other.state.from
    );
  }

  public toDOM(): HTMLElement {
    const anchor = document.createElement("a");
    const img = document.createElement("img");

    img.src = `${process.env.NEXT_PUBLIC_CDN_URL}/web-assets/raw/icons/anchor.svg`;
    img.width = 16;
    img.height = 16;
    img.draggable = false;

    anchor.href = this.state.url;
    anchor.target = "_blank";
    anchor.className = "cm-link-icon";
    anchor.appendChild(img);

    return anchor;
  }

  public ignoreEvent(): boolean {
    return false;
  }
}

const auto_link_decorations = (view: EditorView): RangeSet<Decoration> => {
  const decorations: Array<Range<Decoration>> = [];

  for (const range of view.visibleRanges) {
    syntax_tree(view.state).iterate({
      enter: ({ type, from, to }) => {
        const call_exp = view.state.doc.sliceString(from, to);

        if (type.name === "URL") {
          const widget = Decoration.widget({
            side: 1,
            widget: new AutoLink({
              from,
              to,
              url: call_exp
            })
          });

          decorations.push(widget.range(to));
        }
      },
      from: range.from,
      to: range.to
    });
  }

  return Decoration.set(decorations, true);
};

class AutoLinkViewPluginValue {
  /**
   * Ctor
   * @param view
   */
  constructor(view: EditorView) {
    this.decorations = auto_link_decorations(view);
  }

  /**
   * Decoration set
   */
  public decorations: DecorationSet;

  public update(update: ViewUpdate): void {
    if (update.docChanged || update.viewportChanged) {
      this.decorations = auto_link_decorations(update.view);
    }
  }
}

export const auto_link_extension: () => Extension = () =>
  ViewPlugin.fromClass(AutoLinkViewPluginValue, {
    decorations: ({ decorations }) => decorations
  });
