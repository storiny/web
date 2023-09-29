import { useLexicalComposerContext as use_lexical_composer_context } from "@lexical/react/LexicalComposerContext";
import {
  COMMAND_PRIORITY_EDITOR,
  createCommand as create_command,
  LexicalCommand
} from "lexical";
import React from "react";

import { $create_embed_node, EmbedNode, EmbedPayload } from "../../nodes/embed";
import { $create_figure_node_with_caption } from "../../utils/create-figure-node-with-caption";

export type InsertEmbedPayload = Readonly<EmbedPayload>;

export const INSERT_EMBED_COMMAND: LexicalCommand<InsertEmbedPayload> =
  create_command("INSERT_EMBED_COMMAND");

const EmbedPlugin = (): React.ReactElement | null => {
  const [editor] = use_lexical_composer_context();

  React.useEffect(() => {
    if (!editor.hasNodes([EmbedNode])) {
      throw new Error("EmbedPlugin: EmbedNode not registered on editor");
    }

    return editor.registerCommand<InsertEmbedPayload>(
      INSERT_EMBED_COMMAND,
      (payload) => {
        $create_figure_node_with_caption($create_embed_node(payload));
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);

  return null;
};

export default EmbedPlugin;
