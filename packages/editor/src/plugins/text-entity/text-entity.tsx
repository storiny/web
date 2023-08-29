import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $wrapNodeInElement } from "@lexical/utils";
import {
  $createParagraphNode,
  $createTextNode,
  $insertNodes,
  $isRootOrShadowRoot,
  COMMAND_PRIORITY_EDITOR
} from "lexical";
import React from "react";

import {
  INSERT_TEXT_ENTITY_COMMAND,
  TextEntityPayload
} from "../../commands/text-entity";

export type InsertTextEntityPayload = Readonly<TextEntityPayload>;

const TextEntityPlugin = (): null => {
  const [editor] = useLexicalComposerContext();

  React.useEffect(
    () =>
      editor.registerCommand<InsertTextEntityPayload>(
        INSERT_TEXT_ENTITY_COMMAND,
        (payload) => {
          const textNode = $createTextNode(payload);
          $insertNodes([textNode]);

          if ($isRootOrShadowRoot(textNode.getParentOrThrow())) {
            $wrapNodeInElement(textNode, $createParagraphNode).selectEnd();
          }

          return true;
        },
        COMMAND_PRIORITY_EDITOR
      ),
    [editor]
  );

  return null;
};

export default TextEntityPlugin;
