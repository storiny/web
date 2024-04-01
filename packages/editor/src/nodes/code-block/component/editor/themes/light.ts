import { Extension } from "@codemirror/state";
import { tags as t } from "@lezer/highlight";

import { extend_code_block_theme } from "./base";

export const CODE_BLOCK_LIGHT_THEME = (read_only: boolean): Extension =>
  extend_code_block_theme({
    mode: "light",
    read_only,
    styles: [
      /* eslint-disable prefer-snakecase/prefer-snakecase */
      {
        tag: t.comment,
        color: "#787b8099"
      },
      {
        tag: t.string,
        color: "#86b300"
      },
      {
        tag: t.regexp,
        color: "#4cbf99"
      },
      {
        tag: [t.number, t.bool, t.null],
        color: "#ffaa33"
      },
      {
        tag: [t.keyword, t.definitionKeyword, t.special(t.brace), t.modifier],
        color: "#fa8d3e"
      },
      {
        tag: t.operator,
        color: "#ed9366"
      },
      {
        tag: t.separator,
        color: "#5c6166b3"
      },
      {
        tag: [t.punctuation, t.variableName],
        color: "#5c6166"
      },
      {
        tag: [
          t.definition(t.propertyName),
          t.function(t.variableName),
          t.attributeName
        ],
        color: "#d89634"
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
        color: "#55b4d4"
      },
      {
        tag: t.angleBracket,
        color: "#55b4d480"
      },
      { tag: t.strong, fontWeight: "bold" },
      { tag: t.emphasis, fontStyle: "italic" },
      { tag: t.link, textDecoration: "underline" },
      { tag: t.strikethrough, textDecoration: "line-through" },
      { tag: t.heading, fontWeight: "bold" }
      /* eslint-enable prefer-snakecase/prefer-snakecase */
    ]
  });
