import {
  $getNodeByKey,
  $getRoot,
  $getSelection,
  $isTextNode,
  EditorState,
  NodeKey
} from "lexical";

import { Binding } from "../../collaboration/bindings";
import { CollabTextNode } from "../../collaboration/nodes/text";
import { Provider } from "../../collaboration/provider";
import { syncLexicalSelectionToYjs } from "../sync-lexical-selection-to-yjs";
import { syncWithTransaction } from "../sync-with-transaction";

type IntentionallyMarkedAsDirtyElement = boolean;

/**
 * Handles the normalization merge conflicts
 * @param binding Binding
 * @param normalizedNodes Normalized nodes
 */
const handleNormalizationMergeConflicts = (
  binding: Binding,
  normalizedNodes: Set<NodeKey>
): void => {
  // We handle the merge operations here
  const normalizedNodesKeys = Array.from(normalizedNodes);
  const collabNodeMap = binding.collabNodeMap;
  const mergedNodes: [CollabTextNode | unknown, string | unknown][] = [];

  for (let i = 0; i < normalizedNodesKeys.length; i++) {
    const nodeKey = normalizedNodesKeys[i];
    const lexicalNode = $getNodeByKey(nodeKey);
    const collabNode = collabNodeMap.get(nodeKey);

    if (collabNode instanceof CollabTextNode) {
      if ($isTextNode(lexicalNode)) {
        // We mutate the text collab nodes after removing
        // all the dead nodes first, otherwise the offsets break.
        mergedNodes.push([collabNode, lexicalNode.__text]);
      } else {
        const offset = collabNode.getOffset();

        if (offset === -1) {
          continue;
        }

        const parent = collabNode._parent;

        collabNode._normalized = true;
        parent._xmlText.delete(offset, 1);
        collabNodeMap.delete(nodeKey);

        const parentChildren = parent._children;
        const index = parentChildren.indexOf(collabNode);

        parentChildren.splice(index, 1);
      }
    }
  }

  for (let i = 0; i < mergedNodes.length; i++) {
    const [collabNode, text] = mergedNodes[i];

    if (collabNode instanceof CollabTextNode && typeof text === "string") {
      collabNode._text = text;
    }
  }
};

/**
 * Syncs the editor upadte to yjs
 * @param currEditorState Current editor state
 * @param prevEditorState Previous editor state
 * @param tags Update tags
 * @param normalizedNodes Normalized nodes
 * @param dirtyLeaves Dirty leaves
 * @param dirtyElements Dirty elements
 * @param binding Binding
 * @param provider Provider
 */
export const syncLexicalUpdateToYjs = ({
  currEditorState,
  prevEditorState,
  tags,
  normalizedNodes,
  dirtyLeaves,
  dirtyElements,
  binding,
  provider
}: {
  binding: Binding;
  currEditorState: EditorState;
  dirtyElements: Map<NodeKey, IntentionallyMarkedAsDirtyElement>;
  dirtyLeaves: Set<NodeKey>;
  normalizedNodes: Set<NodeKey>;
  prevEditorState: EditorState;
  provider: Provider;
  tags: Set<string>;
}): void => {
  syncWithTransaction(binding, () => {
    currEditorState.read(() => {
      // We check if the update has come from an origin where the origin
      // was the collaboration binding previously. This can help us
      // prevent unnecessary re-diffing and possible re-applying
      // the same editor state again. For example, if a user
      // types a character, and we get it, we don't want to insert
      // the same character again. The exception to this heuristic is
      // when we need to handle normalization merge conflicts.
      if (tags.has("collaboration") || tags.has("historic")) {
        if (normalizedNodes.size > 0) {
          handleNormalizationMergeConflicts(binding, normalizedNodes);
        }
        return;
      }

      if (dirtyElements.has("root")) {
        const prevNodeMap = prevEditorState._nodeMap;
        const nextLexicalRoot = $getRoot();
        const collabRoot = binding.root;

        collabRoot.syncPropertiesFromLexical(
          binding,
          nextLexicalRoot,
          prevNodeMap
        );

        collabRoot.syncChildrenFromLexical(
          binding,
          nextLexicalRoot,
          prevNodeMap,
          dirtyElements,
          dirtyLeaves
        );
      }

      const selection = $getSelection();
      const prevSelection = prevEditorState._selection;
      syncLexicalSelectionToYjs(binding, provider, prevSelection, selection);
    });
  });
};
