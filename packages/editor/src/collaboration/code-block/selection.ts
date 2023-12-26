import { Annotation, Range, RangeSet } from "@codemirror/state";
import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
  WidgetType
} from "@codemirror/view";
import * as dom from "lib0/dom";
import * as math from "lib0/math";
import * as pair from "lib0/pair";
import { Awareness } from "y-protocols/awareness";
import * as Y from "yjs";

import { code_block_sync_facet, YSyncConfig } from "./sync";

export const code_block_remote_selections_theme = EditorView.baseTheme({
  ".cm-ySelection": {},
  ".cm-yLineSelection": {
    padding: 0,
    margin: "0px 2px 0px 4px"
  },
  ".cm-ySelectionCaret": {
    position: "relative",
    border_left: "1px solid black",
    border_right: "1px solid black",
    margin_left: "-1px",
    margin_right: "-1px",
    box_sizing: "border-box",
    display: "inline"
  },
  ".cm-ySelectionCaretDot": {
    border_radius: "50%",
    position: "absolute",
    width: ".4em",
    height: ".4em",
    top: "-.2em",
    left: "-.2em",
    background_color: "inherit",
    transition: "transform .3s ease-in-out",
    box_sizing: "border-box"
  },
  ".cm-ySelectionCaret:hover > .cm-ySelectionCaretDot": {
    transform_origin: "bottom center",
    transform: "scale(0)"
  },
  ".cm-ySelectionInfo": {
    position: "absolute",
    top: "-1.05em",
    left: "-1px",
    font_size: ".75em",
    font_family: "serif",
    font_style: "normal",
    font_weight: "normal",
    line_height: "normal",
    user_select: "none",
    color: "white",
    padding_left: "2px",
    padding_right: "2px",
    zIndex: 101,
    transition: "opacity .3s ease-in-out",
    background_color: "inherit",
    // These should be separate
    opacity: 0,
    transition_delay: "0s",
    white_space: "nowrap"
  },
  ".cm-ySelectionCaret:hover > .cm-ySelectionInfo": {
    opacity: 1,
    transition_delay: "0s"
  }
});

const code_block_remote_selections_annotation =
  Annotation.define<Array<number>>();

class CodeBlockRemoteCaretWidget extends WidgetType {
  /**
   * Ctor
   * @param color User color
   * @param name User name
   */
  constructor(color: string, name: string) {
    super();

    this.color = color;
    this.name = name;
  }

  /**
   * User color
   * @private
   */
  private readonly color: string;
  /**
   * User name
   * @private
   */
  private readonly name: string;

  // eslint-disable-next-line prefer-snakecase/prefer-snakecase
  toDOM(): HTMLElement {
    return dom.element(
      "span",
      [
        pair.create("class", "cm-ySelectionCaret"),
        pair.create(
          "style",
          `background-color: ${this.color}; border-color: ${this.color}`
        )
      ],
      [
        dom.text("\u2060"),
        dom.element("div", [pair.create("class", "cm-ySelectionCaretDot")]),
        dom.text("\u2060"),
        dom.element(
          "div",
          [pair.create("class", "cm-ySelectionInfo")],
          [dom.text(this.name)]
        ),
        dom.text("\u2060")
      ]
    ) as HTMLElement;
  }

  eq(widget: CodeBlockRemoteCaretWidget): boolean {
    return widget.color === this.color;
  }

  compare(widget: CodeBlockRemoteCaretWidget): boolean {
    return widget.color === this.color;
  }

  updateDOM(): boolean {
    return false;
  }

  get estimated_height(): number {
    return -1;
  }

  ignore_event(): boolean {
    return true;
  }
}

export class YRemoteSelectionsPluginValue {
  /**
   * Ctor
   * @param view
   */
  constructor(view: EditorView) {
    this.view = view;
    this.conf = view.state.facet(code_block_sync_facet);
    this.awareness = this.conf.awareness;
    this.decorations = RangeSet.of([]);

    this.listener = this.listener.bind(this);

    if (this.awareness) {
      this.awareness.on("change", this.listener);
    }
  }

  /**
   * Decorations
   * @private
   */
  public decorations: DecorationSet;
  /**
   * Editor view
   * @private
   */
  private view: EditorView;
  /**
   * Sync config
   * @private
   */
  private conf: YSyncConfig;
  /**
   * Awareness
   * @private
   */
  private awareness: Awareness | null;

  private listener({
    added,
    updated,
    removed
  }: {
    added: number[];
    removed: number[];
    updated: number[];
  }): void {
    const clients = added.concat(updated).concat(removed);

    if (
      clients.findIndex((id) => id !== this.conf.awareness?.doc?.clientID) >= 0
    ) {
      this.view.dispatch({
        annotations: [code_block_remote_selections_annotation.of([])]
      });
    }
  }

  public destroy(): void {
    if (this.awareness) {
      this.awareness.off("change", this.listener);
    }
  }

  public update(update: ViewUpdate): void {
    const ytext = this.conf.ytext;
    const ydoc = ytext.doc;
    const awareness = this.conf.awareness;
    const decorations: Range<Decoration>[] = [];
    const local_awareness_state = this.conf.awareness?.getLocalState?.();

    // Set local awareness state (update cursors)
    if (local_awareness_state != null) {
      const hasFocus =
        update.view.hasFocus && update.view.dom.ownerDocument.hasFocus();
      const sel = hasFocus ? update.state.selection.main : null;

      const current_anchor =
        local_awareness_state.cursor == null
          ? null
          : Y.createRelativePositionFromJSON(
              local_awareness_state.cursor.anchor
            );

      const current_head =
        local_awareness_state.cursor == null
          ? null
          : Y.createRelativePositionFromJSON(local_awareness_state.cursor.head);

      if (sel != null) {
        const anchor = Y.createRelativePositionFromTypeIndex(ytext, sel.anchor);
        const head = Y.createRelativePositionFromTypeIndex(ytext, sel.head);

        if (
          local_awareness_state.cursor == null ||
          !Y.compareRelativePositions(current_anchor, anchor) ||
          !Y.compareRelativePositions(current_head, head)
        ) {
          awareness?.setLocalStateField?.("cursor", {
            anchor,
            head
          });
        }
      } else if (local_awareness_state.cursor != null && hasFocus) {
        awareness?.setLocalStateField?.("cursor", null);
      }
    }

    // Update decorations (remote selections)
    awareness?.getStates()?.forEach((state, client_id) => {
      if (client_id === awareness.doc.clientID) {
        return;
      }

      const cursor = state.cursor;

      if (cursor == null || cursor.anchor == null || cursor.head == null) {
        return;
      }

      const anchor = Y.createAbsolutePositionFromRelativePosition(
        cursor.anchor,
        ydoc!
      );
      const head = Y.createAbsolutePositionFromRelativePosition(
        cursor.head,
        ydoc!
      );

      if (
        anchor == null ||
        head == null ||
        anchor.type !== ytext ||
        head.type !== ytext
      ) {
        return;
      }

      const { name, color, avatar_id, avatar_hex } = state;

      const start = math.min(anchor.index, head.index);
      const end = math.max(anchor.index, head.index);
      const start_line = update.view.state.doc.lineAt(start);
      const end_line = update.view.state.doc.lineAt(end);

      if (start_line.number === end_line.number) {
        // Selected content in a single line.
        decorations.push({
          from: start,
          to: end,
          value: Decoration.mark({
            attributes: { style: `background-color: ${color}` },
            class: "cm-ySelection"
          })
        });
      } else {
        // Selected content in multiple lines.
        // Render text-selection in the first line.
        decorations.push({
          from: start,
          to: start_line.from + start_line.length,
          value: Decoration.mark({
            attributes: { style: `background-color: ${color}` },
            class: "cm-ySelection"
          })
        });
        // Render text-selection in the last line.
        decorations.push({
          from: end_line.from,
          to: end,
          value: Decoration.mark({
            attributes: { style: `background-color: ${color}` },
            class: "cm-ySelection"
          })
        });

        for (let i = start_line.number + 1; i < end_line.number; i++) {
          const line_pos = update.view.state.doc.line(i).from;

          decorations.push({
            from: line_pos,
            to: line_pos,
            value: Decoration.line({
              attributes: {
                style: `background-color: ${color}`,
                class: "cm-yLineSelection"
              }
            })
          });
        }
      }

      decorations.push({
        from: head.index,
        to: head.index,
        value: Decoration.widget({
          side: head.index - anchor.index > 0 ? -1 : 1, // The local cursor should be rendered outside the remote selection.
          block: false,
          widget: new CodeBlockRemoteCaretWidget(color, name)
        })
      });
    });

    this.decorations = Decoration.set(decorations, true);
  }
}

export const code_block_remote_selections = ViewPlugin.fromClass(
  YRemoteSelectionsPluginValue,
  {
    decorations: (v) => v.decorations
  }
);
