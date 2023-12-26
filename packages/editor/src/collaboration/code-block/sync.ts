import {
  Annotation,
  ChangeSpec,
  EditorSelection,
  Facet,
  SelectionRange,
  Text
} from "@codemirror/state";
import { EditorView, ViewPlugin, ViewUpdate } from "@codemirror/view";
import { Awareness } from "y-protocols/awareness";
import {
  createAbsolutePositionFromRelativePosition as create_absolute_position_from_relative_position,
  createRelativePositionFromJSON as create_relative_position_from_json,
  createRelativePositionFromTypeIndex as create_relative_position_from_type_index,
  RelativePosition,
  Text as YText
} from "yjs";

import { YRange } from "./range";

export class YSyncConfig {
  /**
   * Ctor
   * @param ytext
   * @param awareness
   */
  constructor(ytext: YText, awareness: Awareness | null) {
    this.ytext = ytext;
    this.awareness = awareness;
  }

  /**
   * Yjs text
   */
  public readonly ytext: YText;
  /**
   * Awareness
   * @private
   */
  public awareness: Awareness | null;

  /**
   * Helper function to transform an absolute index position to a Yjs-based
   * relative position
   * (https://docs.yjs.dev/api/relative-positions).
   *
   * A relative position can be transformed back to an absolute position even
   * after the document has changed. The position is automatically adapted.
   * This does not require any position transformations. Relative positions
   * are computed based on the internal Yjs document model. Peers that share
   * content through Yjs are guaranteed that their positions will always
   * synced up when using relatve positions.
   *
   * ```js
   * import { ySyncFacet } from 'y-codemirror'
   *
   * const ysync = view.state.facet(ySyncFacet)
   * // transform an absolute index position to a ypos
   * const ypos = ysync.getYPos(3)
   * // transform the ypos back to an absolute position
   * ysync.fromYPos(ypos) // => 3
   * ```
   *
   * It cannot be guaranteed that absolute index positions can be synced up
   * between peers. This might lead to undesired behavior when implementing
   * features that require that all peers see the same marked range (e.g. a
   * comment plugin).
   *
   * @param pos
   * @param assoc
   */
  private to_y_pos(pos: number, assoc = 0): RelativePosition {
    return create_relative_position_from_type_index(this.ytext, pos, assoc);
  }

  private from_y_pos(rpos: RelativePosition): { assoc: number; pos: number } {
    const pos = create_absolute_position_from_relative_position(
      create_relative_position_from_json(rpos),
      this.ytext.doc!
    );

    if (pos == null || pos.type !== this.ytext) {
      throw new Error(
        "[code-block] The position to retrieve was created by a different document"
      );
    }

    return {
      pos: pos.index,
      assoc: pos.assoc
    };
  }

  public to_y_range(range: SelectionRange): YRange {
    const assoc = range.assoc;
    const yanchor = this.to_y_pos(range.anchor, assoc);
    const yhead = this.to_y_pos(range.head, assoc);

    return new YRange(yanchor, yhead);
  }

  public from_y_range(yrange: YRange): SelectionRange {
    const anchor = this.from_y_pos(yrange.yanchor);
    const head = this.from_y_pos(yrange.yhead);

    if (anchor.pos === head.pos) {
      return EditorSelection.cursor(head.pos, head.assoc);
    }

    return EditorSelection.range(anchor.pos, head.pos);
  }
}

export const code_block_sync_facet = Facet.define<YSyncConfig, YSyncConfig>({
  combine: (inputs) => inputs[inputs.length - 1]
});

export const code_block_sync_annotation = Annotation.define<YSyncConfig>();

class YSyncPluginValue {
  /**
   * Ctor
   * @param view
   */
  constructor(view: EditorView) {
    this.view = view;
    this.conf = view.state.facet(code_block_sync_facet);
    this.ytext = this.conf.ytext;

    this.observer = this.observer.bind(this);

    this.ytext.observe(this.observer);
  }

  /**
   * View
   * @private
   */
  private view: EditorView;
  /**
   * Sync config
   * @private
   */
  private readonly conf: YSyncConfig;
  /**
   * Yjs text
   * @private
   */
  private ytext: YText;

  /**
   * Yjs text observer
   * @param event
   * @param tr
   * @private
   */
  private observer(
    event: Parameters<Parameters<YText["observe"]>[0]>[0],
    tr: Parameters<Parameters<YText["observe"]>[0]>[1]
  ): void {
    if (tr.origin !== this.conf) {
      const delta = event.delta;
      const changes: ChangeSpec[] = [];
      let pos = 0;

      for (let i = 0; i < delta.length; i++) {
        const d = delta[i];

        if (d.insert != null) {
          changes.push({
            from: pos,
            to: pos,
            insert: d.insert as string | Text | undefined
          });
        } else if (d.delete != null) {
          changes.push({ from: pos, to: pos + d.delete, insert: "" });
          pos += d.delete;
        } else {
          pos += d.retain || 0;
        }
      }

      this.view.dispatch({
        changes,
        annotations: [code_block_sync_annotation.of(this.conf)]
      });
    }
  }

  public update(update: ViewUpdate): void {
    if (
      !update.docChanged ||
      (update.transactions.length > 0 &&
        update.transactions[0].annotation(code_block_sync_annotation) ===
          this.conf)
    ) {
      return;
    }

    const ytext = this.conf.ytext;

    ytext.doc?.transact(() => {
      /**
       * This variable adjusts the from_a position to the current position
       * in the Y.Text type.
       */
      let adj = 0;

      update.changes.iterChanges((from_a, to_a, _, __, insert) => {
        const insert_text = insert.sliceString(0, insert.length, "\n");

        if (from_a !== to_a) {
          ytext.delete(from_a + adj, to_a - from_a);
        }

        if (insert_text.length > 0) {
          ytext.insert(from_a + adj, insert_text);
        }

        adj += insert_text.length - (to_a - from_a);
      });
    }, this.conf);
  }

  public destroy(): void {
    this.ytext.unobserve(this.observer);
  }
}

export const code_block_sync = ViewPlugin.fromClass(YSyncPluginValue);
