import { AutoLinkNode, LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
import { Klass, LexicalNode } from "lexical";

import { ColorNode } from "./color";
import { HeadingNode } from "./heading";
import { QuoteNode } from "./quote";
import { TKNode } from "./tk";

export const editorNodes: (
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
  AutoLinkNode,
  LinkNode,
  HorizontalRuleNode,
  ColorNode,
  TKNode
];
