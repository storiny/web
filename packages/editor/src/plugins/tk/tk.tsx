import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import { useAtomValue } from "jotai";
import {
  $createTextNode,
  $getNodeByKey,
  $getRoot,
  $isParagraphNode,
  $isTextNode,
  LexicalEditor,
  NodeKey,
  ParagraphNode,
  TextNode
} from "lexical";
import React from "react";

import { enableTKAtom } from "../../atoms";
import { $createTKNode, $isTKNode, TKNode } from "../../nodes/tk";
import styles from "./tk.module.scss";

type ParagraphNodeKey = NodeKey;
type TKNodeKey = NodeKey;

const TK_TOKEN_REGEX = /(?:[^a-zA-Z0-9]|^)TK(?:[^a-zA-Z0-9]|$)/g;

// Keeps the record of all the TK nodes insde the individual paragraph nodes
const paragraphTkMap = new Map<ParagraphNodeKey, Set<TKNodeKey>>();

/**
 * Adds a TK node to the paragraph-TK map
 * @param editor Editor
 * @param paragraphKey Parent paragraph key
 * @param tkNodeKey TK node key
 */
const addTkNodeToMap = (
  editor: LexicalEditor,
  paragraphKey: ParagraphNodeKey,
  tkNodeKey: TKNodeKey
): void => {
  const paragraphMap = paragraphTkMap.get(paragraphKey);

  if (paragraphMap) {
    paragraphMap.add(tkNodeKey);
  } else {
    paragraphTkMap.set(paragraphKey, new Set([tkNodeKey]));
  }

  const element = editor.getElementByKey(paragraphKey);

  if (element && !element.classList.contains(styles.tk)) {
    element.classList.add(styles.tk);
  }
};

/**
 * Removes a TK node from the paragraph-TK map
 * @param editor Editor
 * @param tkNode TK node
 * @param paragraphKey Paragraph key that overrides parent key
 */
const removeTkNodeFromMap = (
  editor: LexicalEditor,
  tkNode: TKNode,
  paragraphKey?: NodeKey
): void => {
  const parentNode = tkNode.getParent();

  if (parentNode) {
    const parentNodeKey = paragraphKey ?? parentNode.getKey();
    const paragraphMap = paragraphTkMap.get(parentNodeKey);

    if (paragraphMap) {
      paragraphMap.delete(tkNode.getKey());

      if (!paragraphMap.size) {
        paragraphTkMap.delete(parentNodeKey);

        if ($isParagraphNode(parentNode)) {
          const element = editor.getElementByKey(parentNodeKey);

          if (element) {
            element.classList.remove(styles.tk);
          }
        }
      }
    }
  }
};

/**
 * Text to TK node transformer
 * @param node Text node
 */
const tkTransform = (node: TextNode): void => {
  if (node.getFormat() === 0 && $isParagraphNode(node.getParent())) {
    const textContent = node.getTextContent();

    if (TK_TOKEN_REGEX.test(textContent)) {
      const index = textContent.indexOf("TK");
      let targetNode: TKNode;

      if (index === 0) {
        [targetNode] = node.splitText(index + 2);
      } else {
        [, targetNode] = node.splitText(index, index + 3);
      }

      if (targetNode) {
        targetNode.replace($createTKNode(targetNode.getTextContent()));
      }
    }
  }
};

const TKPluginImpl = (): null => {
  const [editor] = useLexicalComposerContext();

  React.useEffect(
    () =>
      mergeRegister(
        editor.registerNodeTransform<TextNode>(TextNode, tkTransform),
        // Handle TK node mutations
        editor.registerMutationListener(
          TKNode,
          (nodes, { prevEditorState }) => {
            for (const [nodeKey, mutation] of nodes) {
              if (mutation === "created") {
                editor.getEditorState().read(() => {
                  const tkNode = $getNodeByKey<TKNode>(nodeKey);

                  if (tkNode) {
                    const paragraphNode = tkNode.getParent();

                    if ($isParagraphNode(paragraphNode)) {
                      addTkNodeToMap(
                        editor,
                        paragraphNode.getKey(),
                        tkNode.getKey()
                      );
                    }
                  }
                });
              } else if (mutation === "updated") {
                editor.getEditorState().read(() => {
                  const tkNode = $getNodeByKey<TKNode>(nodeKey);

                  if (tkNode) {
                    const tkNodeKey = tkNode.getKey();
                    const paragraphNode = tkNode.getParent();

                    if ($isParagraphNode(paragraphNode)) {
                      const paragraphKey = paragraphNode.getKey();

                      // TK nodes can move under a different parent paragraph node, so when
                      // they get updated, clean all the previous paragraph node sets that
                      // include this TK node.
                      for (const [
                        paragraphNodeKey,
                        paragraphNodeSet
                      ] of paragraphTkMap.entries()) {
                        if (
                          paragraphNodeKey !== paragraphKey &&
                          paragraphNodeSet.has(tkNodeKey)
                        ) {
                          removeTkNodeFromMap(editor, tkNode, paragraphNodeKey);
                        }
                      }

                      addTkNodeToMap(editor, paragraphKey, tkNode.getKey());
                    } else {
                      removeTkNodeFromMap(editor, tkNode);
                      editor.update(
                        () => {
                          tkNode.replace(
                            $createTextNode(tkNode.getTextContent())
                          );
                        },
                        { tag: "history-merge" }
                      );
                    }
                  }
                });
              } else if (mutation === "destroyed") {
                prevEditorState.read(() => {
                  const tkNode = $getNodeByKey<TKNode>(
                    nodeKey,
                    prevEditorState
                  );
                  if (tkNode) {
                    removeTkNodeFromMap(editor, tkNode);
                  }
                });
              }
            }
          }
        ),
        // Convert the TK node to a text node when the parent paragraph node is changed to
        // something else (for example, a heading node)
        editor.registerMutationListener(
          ParagraphNode,
          (nodes, { dirtyLeaves }) => {
            for (const [, mutation] of nodes) {
              if (mutation === "destroyed") {
                editor.update(
                  () => {
                    for (const key of dirtyLeaves) {
                      const node = $getNodeByKey(key);

                      if ($isTKNode(node)) {
                        node.replace($createTextNode(node.getTextContent()));
                      }
                    }
                  },
                  { tag: "history-merge" }
                );
              }
            }
          }
        )
      ),
    [editor]
  );

  return null;
};

const TKPlugin = (): React.ReactElement | null => {
  const [editor] = useLexicalComposerContext();
  const firstRenderRef = React.useRef<boolean>(true);
  const enableTk = useAtomValue(enableTKAtom);

  React.useEffect(() => {
    if (!firstRenderRef.current) {
      editor.update(
        () => {
          // Filter out all the paragraph nodes
          const paragraphNodes = $getRoot()
            .getChildren()
            .filter($isParagraphNode);

          if (enableTk) {
            // Create TK nodes
            for (const paragraphNode of paragraphNodes) {
              for (const childNode of paragraphNode
                .getChildren()
                .filter($isTextNode)) {
                tkTransform(childNode);
              }
            }
          } else {
            // Replace TK nodes with text nodes
            for (const paragraphNode of paragraphNodes) {
              for (const childNode of paragraphNode.getChildren()) {
                if ($isTKNode(childNode)) {
                  removeTkNodeFromMap(editor, childNode);
                  childNode.replace(
                    $createTextNode(childNode.getTextContent())
                  );
                }
              }
            }
          }
        },
        { tag: "history-merge" }
      );
    }

    firstRenderRef.current = false;
  }, [enableTk, editor]);

  if (!enableTk) {
    return null;
  }

  return <TKPluginImpl />;
};

export default TKPlugin;
