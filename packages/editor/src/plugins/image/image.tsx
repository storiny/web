import { $createLinkNode } from "@lexical/link";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $insertNodeToNearestRoot } from "@lexical/utils";
import {
  $createParagraphNode,
  $createTextNode,
  $insertNodes,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  LexicalCommand
} from "lexical";
import React from "react";

import { $createImageNode, ImageNode, ImagePayload } from "../../nodes/image";

export type InsertImagePayload = Readonly<
  ImagePayload & { credits?: { author: string; url: string } }
>;

export const INSERT_IMAGE_COMMAND: LexicalCommand<InsertImagePayload> =
  createCommand("INSERT_IMAGE_COMMAND");

const ImagePlugin = (): React.ReactElement | null => {
  const [editor] = useLexicalComposerContext();

  React.useEffect(() => {
    if (!editor.hasNodes([ImageNode])) {
      throw new Error("ImagePlugin: ImageNode not registered on editor");
    }

    return editor.registerCommand<InsertImagePayload>(
      INSERT_IMAGE_COMMAND,
      ({ credits, ...rest }) => {
        const imageNode = $createImageNode(rest);
        $insertNodeToNearestRoot(imageNode);

        // Caption

        const captionNode = $createParagraphNode().setFormat("center");

        if (credits) {
          captionNode.append(
            ...[
              $createTextNode("Photo by"),
              $createLinkNode(credits.url, {
                rel: "noreferrer",
                target: "_blank"
              }).append($createTextNode(credits.author)),
              $createTextNode("on"),
              $createLinkNode(
                "https://pexels.com?utm_source=storiny&utm_medium=referral",
                { rel: "noreferrer", target: "_blank" }
              ).append($createTextNode("Pexels"))
            ]
          );
        } else {
          captionNode.append($createTextNode("Image caption"));
        }

        $insertNodes([captionNode, $createParagraphNode()]);

        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);

  return null;
};

export default ImagePlugin;
