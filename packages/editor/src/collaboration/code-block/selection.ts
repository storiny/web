import { Annotation, Range, RangeSet } from "@codemirror/state";
import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
  WidgetType
} from "@codemirror/view";
import { clsx } from "clsx";
import { Awareness } from "y-protocols/awareness";
import * as Y from "yjs";

import css from "~/theme/main.module.scss";

import cursor_styles from "../../utils/sync-cursor-positions/styles.module.scss";
import styles from "./styles.module.scss";
import { code_block_sync_facet, YSyncConfig } from "./sync";

const code_block_remote_selections_annotation =
  Annotation.define<Array<number>>();

class CodeBlockRemoteCaretWidget extends WidgetType {
  /**
   * Ctor
   * @param name User name
   * @param color_bg Background color
   * @param color_fg Foreground color
   * @param type Caret type
   */
  constructor(name: string, color_fg: string, color_bg: string, type: string) {
    super();

    this.name = name;
    this.color_fg = color_fg;
    this.color_bg = color_bg;
    this.type = type;
  }

  /**
   * Background color
   * @private
   */
  private readonly color_bg: string;

  /**
   * Foreground color
   * @private
   */
  private readonly color_fg: string;

  /**
   * User name
   * @private
   */
  private readonly name: string;

  /**
   * Caret type
   * @private
   */
  private readonly type: string;

  toDOM(): HTMLElement {
    const caret = document.createElement("span");
    caret.className = styles["selection-caret"];
    caret.style.setProperty("--color-bg", this.color_bg);
    caret.style.setProperty("--color-fg", this.color_fg);

    if (this.type === "mini") {
      caret.classList.add(styles.mini);
    } else {
      const name = document.createElement("span");
      name.textContent = this.name;
      name.className = clsx(css.ellipsis, cursor_styles.name, styles.name);

      caret.appendChild(name);
    }

    return caret;
  }

  eq(widget: CodeBlockRemoteCaretWidget): boolean {
    return widget.color_bg === this.color_bg && widget.type === this.type;
  }

  compare(widget: CodeBlockRemoteCaretWidget): boolean {
    return widget.color_bg === this.color_bg && widget.type === this.type;
  }

  // eslint-disable-next-line prefer-snakecase/prefer-snakecase
  updateDOM(): boolean {
    return false;
  }

  // eslint-disable-next-line prefer-snakecase/prefer-snakecase
  get estimatedHeight(): number {
    return -1;
  }

  ignoreEvent(): boolean {
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
  private readonly awareness: Awareness | null;

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

    if (process.env.NEXT_PUBLIC_ENV === "test") {
      return;
    }

    if (awareness) {
      const local_awareness_state = awareness.getLocalState();

      // Set local awareness state (update cursors)
      if (local_awareness_state != null) {
        const hasFocus =
          update.view.hasFocus && update.view.dom.ownerDocument.hasFocus();
        const sel = hasFocus ? update.state.selection.main : null;

        const current_anchor =
          local_awareness_state.code_block_cursor == null
            ? null
            : Y.createRelativePositionFromJSON(
                local_awareness_state.code_block_cursor.anchor
              );

        const current_head =
          local_awareness_state.code_block_cursor == null
            ? null
            : Y.createRelativePositionFromJSON(
                local_awareness_state.code_block_cursor.head
              );

        if (sel != null) {
          const anchor = Y.createRelativePositionFromTypeIndex(
            ytext,
            sel.anchor
          );
          const head = Y.createRelativePositionFromTypeIndex(ytext, sel.head);

          if (
            local_awareness_state.code_block_cursor == null ||
            !Y.compareRelativePositions(current_anchor, anchor) ||
            !Y.compareRelativePositions(current_head, head)
          ) {
            awareness.setLocalStateField("focus_pos", null);
            awareness.setLocalStateField("anchor_pos", null);
            awareness.setLocalStateField("code_block_cursor", {
              anchor,
              head
            });
          }
        } else if (local_awareness_state.code_block_cursor != null) {
          awareness.setLocalStateField("code_block_cursor", null);
        }
      }

      const decorations: Range<Decoration>[] = [];
      const local_client_id = awareness.doc.clientID;
      const awareness_states = awareness.getStates();
      const { cursor_type } = awareness_states.get(local_client_id) || {};

      // Update decorations (remote selections)
      awareness_states.forEach((state, client_id) => {
        if (client_id === local_client_id) {
          return;
        }

        const cursor = state.code_block_cursor;

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

        const { name, color_bg, color_fg, selection_color } = state;
        const start = Math.min(anchor.index, head.index);
        const end = Math.max(anchor.index, head.index);
        const start_line = update.view.state.doc.lineAt(start);
        const end_line = update.view.state.doc.lineAt(end);

        if (start_line.number === end_line.number) {
          // Selected content in a single line.
          decorations.push({
            from: start,
            to: end,
            value: Decoration.mark({
              attributes: { style: `background-color: ${selection_color}` },
              class: styles.selection
            })
          });
        } else {
          // Selected content in multiple lines.
          // Render text-selection in the first line.
          decorations.push({
            from: start,
            to: start_line.from + start_line.length,
            value: Decoration.mark({
              attributes: { style: `background-color: ${selection_color}` },
              class: styles.selection
            })
          });
          // Render text-selection in the last line.
          decorations.push({
            from: end_line.from,
            to: end,
            value: Decoration.mark({
              attributes: { style: `background-color: ${selection_color}` },
              class: styles.selection
            })
          });

          for (let i = start_line.number + 1; i < end_line.number; i++) {
            const line_pos = update.view.state.doc.line(i).from;

            decorations.push({
              from: line_pos,
              to: line_pos,
              value: Decoration.line({
                attributes: {
                  style: `background-color: ${selection_color}`,
                  class: styles["line-selection"]
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
            widget: new CodeBlockRemoteCaretWidget(
              name,
              color_fg,
              color_bg,
              cursor_type
            )
          })
        });
      });

      this.decorations = Decoration.set(decorations, true);
    }
  }
}

export const code_block_remote_selections = ViewPlugin.fromClass(
  YRemoteSelectionsPluginValue,
  {
    decorations: ({ decorations }) => decorations
  }
);
