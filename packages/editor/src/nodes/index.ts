import { LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
import { Klass, LexicalNode } from "lexical";

import { CaptionNode } from "./caption";
import { CodeBlockNode } from "./code-block";
import { ColorNode } from "./color";
import { EmbedNode } from "./embed";
import { FigureNode } from "./figure";
import { HeadingNode } from "./heading";
import { ImageNode } from "./image";
import { MentionNode } from "./mention";
import { QuoteNode } from "./quote";
import { TKNode } from "./tk";

export const EDITOR_NODES: (
  | Klass<LexicalNode>
  | {
      replace: Klass<LexicalNode>;
      with: <T extends { new (...args: any): any }>(
        node: InstanceType<T>
      ) => LexicalNode;
    }
)[] = [
  HeadingNode,
  ListNode,
  ListItemNode,
  QuoteNode,
  LinkNode,
  HorizontalRuleNode,
  ColorNode,
  MentionNode,
  TKNode,
  ImageNode,
  CodeBlockNode,
  CaptionNode,
  FigureNode,
  EmbedNode
];
