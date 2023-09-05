import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection";
import { mergeRegister } from "@lexical/utils";
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

import { $isFigureNode } from "../figure";
import styles from "./block.module.scss";

export type SerializedBlockNode = SerializedLexicalNode;

const TYPE = "block";
const VERSION = 1;

// noinspection TypeScriptFieldCanBeMadeReadonly
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
  override exportJSON(): SerializedBlockNode {
    return {
      type: TYPE,
      version: VERSION
    };
  }

  /**
   * Creates DOM
   */
  override createDOM(): HTMLElement {
    const element = document.createElement("div");
    element.classList.add("flex-center", styles.block);
    return element;
  }

  /**
   * Skips updating the DOM
   */
  override updateDOM(): false {
    return false;
  }

  /**
   * Marks the node as block node
   */
  override isInline(): false {
    return false;
  }

  /**
   * Called when the node is about to get removed
   * @param preserveEmptyParent Whether to preserve empty parent
   */
  override remove(preserveEmptyParent?: boolean): void {
    const figureNode = this.getParent();

    // Remove the entire figure node
    if ($isFigureNode(figureNode)) {
      figureNode.remove();
    } else {
      super.remove(preserveEmptyParent);
    }
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

export const Block = React.forwardRef<
  HTMLDivElement,
  {
    nodeKey: NodeKey;
  } & React.ComponentPropsWithRef<"div">
>((props, refProp) => {
  const { nodeKey, children, ...rest } = props;
  const [editor] = useLexicalComposerContext();
  const [isSelected, setSelected, clearSelection] =
    useLexicalNodeSelection(nodeKey);
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useImperativeHandle(refProp, () => ref.current!);

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
});

Block.displayName = "Block";
