import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection";
import { mergeRegister } from "@lexical/utils";
import { clsx } from "clsx";
import {
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  DecoratorNode,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode
} from "lexical";
import React from "react";

import styles from "../../theme/theme.module.scss";

export type SerializedBlockNode = SerializedLexicalNode;

const TYPE = "block";

export abstract class BlockNode extends DecoratorNode<React.ReactElement> {
  /**
   * Ctor
   * @param key Node key
   * @protected
   */
  protected constructor(key?: NodeKey) {
    super(key);
  }

  /**
   * Serializes the node to JSON
   */
  exportJSON(): SerializedBlockNode {
    return {
      type: TYPE,
      version: 1
    };
  }

  /**
   * Creates DOM
   */
  createDOM(): HTMLElement {
    const element = document.createElement("div");
    element.className = clsx("flex-center", styles.block);
    return element;
  }

  /**
   * Determines whether the DOM needs to be updated based on the returned
   * boolean value
   */
  updateDOM(): false {
    return false;
  }

  /**
   * Determines whether the node is inline
   */
  isInline(): false {
    return false;
  }
}

/**
 * Predicate function for determining block nodes
 * @param node Node
 */
export const $isBlockNode = (
  node: LexicalNode | null | undefined
): node is BlockNode => node instanceof BlockNode;

// Block component

export const Block = ({
  nodeKey,
  children,
  ...rest
}: {
  nodeKey: NodeKey;
} & React.ComponentPropsWithoutRef<"div">): React.ReactElement => {
  const [editor] = useLexicalComposerContext();
  const [isSelected, setSelected, clearSelection] =
    useLexicalNodeSelection(nodeKey);
  const ref = React.useRef<HTMLDivElement | null>(null);

  /**
   * Deletes the node
   */
  const onDelete = React.useCallback(
    (event: KeyboardEvent) => {
      if (isSelected && $isNodeSelection($getSelection())) {
        event.preventDefault();
        const node = $getNodeByKey(nodeKey);

        if ($isBlockNode(node)) {
          node.remove();
        }
      }

      return false;
    },
    [isSelected, nodeKey]
  );

  React.useEffect(
    () =>
      mergeRegister(
        editor.registerCommand<MouseEvent>(
          CLICK_COMMAND,
          (event) => {
            if (event.target === ref.current) {
              event.preventDefault();

              if (!event.shiftKey) {
                clearSelection();
              }

              setSelected(!isSelected);

              return true;
            }

            return false;
          },
          COMMAND_PRIORITY_LOW
        ),
        editor.registerCommand(
          KEY_DELETE_COMMAND,
          onDelete,
          COMMAND_PRIORITY_LOW
        ),
        editor.registerCommand(
          KEY_BACKSPACE_COMMAND,
          onDelete,
          COMMAND_PRIORITY_LOW
        )
      ),
    [clearSelection, editor, isSelected, nodeKey, onDelete, setSelected]
  );

  return (
    <div {...rest} ref={ref}>
      {children}
    </div>
  );
};
