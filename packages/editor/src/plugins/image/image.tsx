import { $createLinkNode as $create_link_node } from "@lexical/link";
import { useLexicalComposerContext as use_lexical_composer_context } from "@lexical/react/LexicalComposerContext";
import {
  $createTextNode as $create_text_node,
  COMMAND_PRIORITY_EDITOR,
  createCommand as create_command,
  LexicalCommand
} from "lexical";
import React from "react";

import { $create_image_node, ImageNode, ImagePayload } from "../../nodes/image";
import { $create_figure_node_with_caption } from "../../utils/create-figure-node-with-caption";

export type InsertImagePayload = Readonly<
  ImagePayload & { credits?: { author: string; url: string } }
>;

export const INSERT_IMAGE_COMMAND: LexicalCommand<InsertImagePayload> =
  create_command("INSERT_IMAGE_COMMAND");

const ImagePlugin = (): React.ReactElement | null => {
  const [editor] = use_lexical_composer_context();

  React.useEffect(() => {
    if (!editor.hasNodes([ImageNode])) {
      throw new Error("ImagePlugin: ImageNode not registered on editor");
    }

    return editor.registerCommand<InsertImagePayload>(
      INSERT_IMAGE_COMMAND,
      ({ credits, ...rest }) => {
        $create_figure_node_with_caption(
          $create_image_node(rest),
          credits
            ? [
                $create_text_node("Photo by"),
                $create_link_node(credits.url, {
                  rel: "noreferrer",
                  target: "_blank"
                }).append($create_text_node(credits.author)),
                $create_text_node("on"),
                $create_link_node(
                  "https://pexels.com?utm_source=storiny&utm_medium=referral",
                  { rel: "noreferrer", target: "_blank" }
                ).append($create_text_node("Pexels"))
              ]
            : null
        );

        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);

  return null;
};

export default ImagePlugin;
