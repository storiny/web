import { Annotation, Range, RangeSet } from "@codemirror/state";
import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
  WidgetType
} from "@codemirror/view";
import { ImageSize } from "@storiny/shared";
import { clsx } from "clsx";
import { Awareness } from "y-protocols/awareness";
import * as Y from "yjs";

import css from "~/theme/main.module.scss";
import { get_cdn_url } from "~/utils/get-cdn-url";

import cursor_styles from "../../utils/sync-cursor-positions/styles.module.scss";
import styles from "./styles.module.scss";
import { code_block_sync_facet, YSyncConfig } from "./sync";

const code_block_remote_selections_annotation =
  Annotation.define<Array<number>>();

class CodeBlockRemoteCaretWidget extends WidgetType {
  /**
   * Ctor
   * @param color User color
   * @param name User name
   * @param avatar_id User avatar ID
   * @param avatar_hex User avatar hex
   *
   */
  constructor(
    color: string,
    name: string,
    avatar_id: string | null,
    avatar_hex: string | null
  ) {
    super();

    this.color = color;
    this.name = name;
    this.avatar_id = avatar_id;
    this.avatar_hex = avatar_hex;
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
  /**
   * User avatar ID
   * @private
   */
  private readonly avatar_id: string | null;
  /**
   * User avatar hex
   * @private
   */
  private readonly avatar_hex: string | null;

  toDOM(): HTMLElement {
    const caret = document.createElement("span");
    caret.className = styles["selection-caret"];
    caret.style.setProperty("--color", this.color);

    const wrapper = document.createElement("span");
    wrapper.className = clsx(css["flex-center"], cursor_styles.wrapper);

    if (this.avatar_id) {
      const avatar = document.createElement("img");
      avatar.alt = "";
      avatar.src = get_cdn_url(this.avatar_id, ImageSize.W_32);
      avatar.className = cursor_styles.avatar;
      avatar.style.setProperty(
        "--hex",
        this.avatar_hex ? `#${this.avatar_hex}` : "transparent"
      );

      avatar.onload = (): void => {
        avatar.style.removeProperty("--hex");
      };

      avatar.onerror = (): void => {
        avatar.style.display = "none";
      };

      wrapper.appendChild(avatar);
    }

    const name = document.createElement("span");
    name.textContent = this.name;
    name.className = clsx(css["ellipsis"], css["f-grow"], cursor_styles.name);

    wrapper.appendChild(name);
    caret.appendChild(wrapper);

    return caret;
  }

  eq(widget: CodeBlockRemoteCaretWidget): boolean {
    return widget.color === this.color;
  }

  compare(widget: CodeBlockRemoteCaretWidget): boolean {
    return widget.color === this.color;
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
            awareness.setLocalStateField("code_block_cursor", {
              anchor,
              head
            });
          }
        } else if (
          local_awareness_state.code_block_cursor != null &&
          hasFocus
        ) {
          awareness.setLocalStateField("code_block_cursor", null);
        }
      }

      const decorations: Range<Decoration>[] = [];

      // Update decorations (remote selections)
      awareness.getStates().forEach((state, client_id) => {
        if (client_id === awareness.doc.clientID) {
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

        const { name, color, selection_color, avatar_id, avatar_hex } = state;

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
              color,
              name,
              avatar_id,
              avatar_hex
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
