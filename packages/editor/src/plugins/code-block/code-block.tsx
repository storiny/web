import { useLexicalComposerContext as use_lexical_composer_context } from "@lexical/react/LexicalComposerContext";
import { $insertNodeToNearestRoot as $insert_node_to_nearest_root } from "@lexical/utils";
import {
  $createParagraphNode as $create_paragraph_node,
  COMMAND_PRIORITY_EDITOR,
  createCommand as create_command,
  LexicalCommand
} from "lexical";
import React from "react";

import {
  $create_code_block_node,
  CodeBlockNode,
  CodeBlockPayload
} from "../../nodes/code-block";

export type InsertCodeBlockPayload = Readonly<CodeBlockPayload>;

export const INSERT_CODE_BLOCK_COMMAND: LexicalCommand<InsertCodeBlockPayload> =
  create_command("INSERT_CODE_BLOCK_COMMAND");

const CodeBlockPlugin = (): React.ReactElement | null => {
  const [editor] = use_lexical_composer_context();

  React.useEffect(() => {
    if (!editor.hasNodes([CodeBlockNode])) {
      throw new Error(
        "CodeBlockPlugin: CodeBlockNode not registered on editor"
      );
    }

    return editor.registerCommand<InsertCodeBlockPayload>(
      INSERT_CODE_BLOCK_COMMAND,
      (payload) => {
        const code_block_node = $create_code_block_node(payload);
        $insert_node_to_nearest_root(code_block_node).insertAfter(
          $create_paragraph_node()
        );

        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);

  return null;
};

export default CodeBlockPlugin;
