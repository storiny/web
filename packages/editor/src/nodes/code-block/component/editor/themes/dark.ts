import { Extension } from "@codemirror/state";
import { tags as t } from "@lezer/highlight";

import { extend_code_block_theme } from "./base";

export const CODE_BLOCK_DARK_THEME = (read_only: boolean): Extension =>
  extend_code_block_theme({
    mode: "dark",
    read_only,
    styles: [
      /* eslint-disable prefer-snakecase/prefer-snakecase */
      {
        tag: t.comment,
        color: "#acb6bf8c"
      },
      {
        tag: t.string,
        color: "#aad94c"
      },
      {
        tag: t.regexp,
        color: "#95e6cb"
      },
      {
        tag: [t.number, t.bool, t.null],
        color: "#d2a6ff"
      },
      {
        tag: [t.keyword, t.definitionKeyword, t.modifier, t.special(t.brace)],
        color: "#ff8f40"
      },
      {
        tag: t.operator,
        color: "#f29668"
      },
      {
        tag: t.separator,
        color: "#bfbdb6b3"
      },
      {
        tag: [t.punctuation, t.variableName],
        color: "#bfbdb6"
      },
      {
        tag: [
          t.attributeName,
          t.definition(t.propertyName),
          t.function(t.variableName)
        ],
        color: "#ffb454"
      },
      {
        tag: [
          t.tagName,
          t.className,
          t.typeName,
          t.definition(t.typeName),
          t.self,
          t.labelName
        ],
        color: "#39bae6"
      },
      {
        tag: t.angleBracket,
        color: "#39bae680"
      },
      { tag: t.strong, fontWeight: "bold" },
      { tag: t.emphasis, fontStyle: "italic" },
      { tag: t.link, textDecoration: "underline" },
      { tag: t.heading, fontWeight: "bold" },
      { tag: t.strikethrough, textDecoration: "line-through" }
      /* eslint-enable prefer-snakecase/prefer-snakecase */
    ]
  });
