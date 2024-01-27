import { DocUserRole } from "@storiny/types";
import {
  $getNodeByKey as $get_node_by_key,
  $getRoot as $get_root,
  $getSelection as $get_selection,
  $isTextNode as $is_text_node,
  EditorState,
  NodeKey
} from "lexical";

import { Binding } from "../../collaboration/bindings";
import { CollabTextNode } from "../../collaboration/nodes/text";
import { Provider } from "../../collaboration/provider";
import { sync_lexical_selection_to_yjs } from "../sync-lexical-selection-to-yjs";
import { sync_with_transaction } from "../sync-with-transaction";

type IntentionallyMarkedAsDirtyElement = boolean;

/**
 * Handles the normalization merge conflicts
 * @param binding Binding
 * @param normalized_nodes Normalized nodes
 */
const handle_normalization_merge_conflicts = (
  binding: Binding,
  normalized_nodes: Set<NodeKey>
): void => {
  // We handle the merge operations here
  const normalized_nodes_keys = Array.from(normalized_nodes);
  const collab_node_map = binding.collab_node_map;
  const merged_nodes: [CollabTextNode | unknown, string | unknown][] = [];

  for (let i = 0; i < normalized_nodes_keys.length; i++) {
    const node_key = normalized_nodes_keys[i];
    const lexical_node = $get_node_by_key(node_key);
    const collab_node = collab_node_map.get(node_key);

    if (collab_node instanceof CollabTextNode) {
      if ($is_text_node(lexical_node)) {
        // We mutate the text collab nodes after removing all the dead nodes
        // first, otherwise the offsets break.
        merged_nodes.push([collab_node, lexical_node.__text]);
      } else {
        const offset = collab_node.get_offset();

        if (offset === -1) {
          continue;
        }

        const parent = collab_node._parent;

        collab_node._normalized = true;
        parent._xml_text.delete(offset, 1);
        collab_node_map.delete(node_key);

        const parent_children = parent._children;
        const index = parent_children.indexOf(collab_node);

        parent_children.splice(index, 1);
      }
    }
  }

  for (let i = 0; i < merged_nodes.length; i++) {
    const [collab_node, text] = merged_nodes[i];

    if (collab_node instanceof CollabTextNode && typeof text === "string") {
      collab_node._text = text;
    }
  }
};

/**
 * Syncs the editor upadte to yjs
 * @param curr_editor_state Current editor state
 * @param prev_editor_state Previous editor state
 * @param tags Update tags
 * @param normalized_nodes Normalized nodes
 * @param dirty_leaves Dirty leaves
 * @param dirty_elements Dirty elements
 * @param binding Binding
 * @param provider Provider
 * @param role The role of the peer
 */
export const sync_lexical_update_to_yjs = ({
  curr_editor_state,
  prev_editor_state,
  tags,
  normalized_nodes,
  dirty_leaves,
  dirty_elements,
  binding,
  provider,
  role
}: {
  binding: Binding;
  curr_editor_state: EditorState;
  dirty_elements: Map<NodeKey, IntentionallyMarkedAsDirtyElement>;
  dirty_leaves: Set<NodeKey>;
  normalized_nodes: Set<NodeKey>;
  prev_editor_state: EditorState;
  provider: Provider;
  role: Exclude<DocUserRole, "reader">;
  tags: Set<string>;
}): void => {
  sync_with_transaction(binding, () => {
    curr_editor_state.read(() => {
      /**
       * We check if the update has come from an origin where the origin
       * was the collaboration binding previously. This can help us
       * prevent unnecessary re-diffing and possible re-applying
       * the same editor state again. For example, if a user
       * types a character, and we get it, we don't want to insert
       * the same character again. The exception to this heuristic is
       * when we need to handle normalization merge conflicts.
       */
      if (tags.has("collaboration") || tags.has("historic")) {
        if (normalized_nodes.size > 0) {
          handle_normalization_merge_conflicts(binding, normalized_nodes);
        }

        return;
      }

      if (dirty_elements.has("root")) {
        const prev_node_map = prev_editor_state._nodeMap;
        const next_lexical_root = $get_root();
        const collab_root = binding.root;

        collab_root.sync_properties_from_lexical(
          binding,
          next_lexical_root,
          prev_node_map
        );
        collab_root.sync_children_from_lexical(
          binding,
          next_lexical_root,
          prev_node_map,
          dirty_elements,
          dirty_leaves
        );
      }

      if (role !== "viewer") {
        const selection = $get_selection();
        const prev_selection = prev_editor_state._selection;
        sync_lexical_selection_to_yjs(
          binding,
          provider,
          prev_selection,
          selection
        );
      }
    });
  });
};
