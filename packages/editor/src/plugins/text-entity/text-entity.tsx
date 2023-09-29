import { useLexicalComposerContext as use_lexical_composer_context } from "@lexical/react/LexicalComposerContext";
import { $wrapNodeInElement as $wrap_node_in_element } from "@lexical/utils";
import {
  $createParagraphNode as $create_paragraph_node,
  $createTextNode as $create_text_node,
  $insertNodes as $insert_nodes,
  $isRootOrShadowRoot as $is_root_or_shadow_root,
  COMMAND_PRIORITY_EDITOR
} from "lexical";
import React from "react";

import {
  INSERT_TEXT_ENTITY_COMMAND,
  TextEntityPayload
} from "../../commands/text-entity";

export type InsertTextEntityPayload = Readonly<TextEntityPayload>;

const TextEntityPlugin = (): null => {
  const [editor] = use_lexical_composer_context();

  React.useEffect(
    () =>
      editor.registerCommand<InsertTextEntityPayload>(
        INSERT_TEXT_ENTITY_COMMAND,
        (payload) => {
          const text_node = $create_text_node(payload);
          $insert_nodes([text_node]);

          if ($is_root_or_shadow_root(text_node.getParentOrThrow())) {
            $wrap_node_in_element(
              text_node,
              $create_paragraph_node
            ).selectEnd();
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
