import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  LexicalCommand
} from "lexical";
import React from "react";

import { $createEmbedNode, EmbedNode, EmbedPayload } from "../../nodes/embed";
import { $createFigureNodeWithCaption } from "../../utils/create-figure-node-with-caption";

export type InsertEmbedPayload = Readonly<EmbedPayload>;

export const INSERT_EMBED_COMMAND: LexicalCommand<InsertEmbedPayload> =
  createCommand("INSERT_EMBED_COMMAND");

const EmbedPlugin = (): React.ReactElement | null => {
  const [editor] = useLexicalComposerContext();

  React.useEffect(() => {
    if (!editor.hasNodes([EmbedNode])) {
      throw new Error("EmbedPlugin: EmbedNode not registered on editor");
    }

    return editor.registerCommand<InsertEmbedPayload>(
      INSERT_EMBED_COMMAND,
      (payload) => {
        $createFigureNodeWithCaption($createEmbedNode(payload));
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);

  return null;
};

export default EmbedPlugin;
