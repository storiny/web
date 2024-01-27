import { Extension } from "@codemirror/state";
import { tags as t } from "@lezer/highlight";

import { extend_code_block_theme } from "./base";

export const CODE_BLOCK_LIGHT_THEME = (read_only: boolean): Extension =>
  extend_code_block_theme({
    mode: "light",
    read_only,
    styles: [
      /* eslint-disable prefer-snakecase/prefer-snakecase */
      { tag: t.comment, color: "#8e908c" },
      {
        tag: [
          t.variableName,
          t.self,
          t.propertyName,
          t.attributeName,
          t.regexp
        ],
        color: "#c82829"
      },
      { tag: [t.number, t.bool, t.null], color: "#f5871f" },
      {
        tag: [t.className, t.typeName, t.definition(t.typeName)],
        color: "#997800"
      },
      { tag: [t.string, t.special(t.brace)], color: "#718C00" },
      { tag: t.operator, color: "#3e999f" },
      {
        tag: [t.definition(t.propertyName), t.function(t.variableName)],
        color: "#4271ae"
      },
      { tag: t.keyword, color: "#8959ab" },
      { tag: t.derefOperator, color: "#4d4d4c" }
      /* eslint-enable prefer-snakecase/prefer-snakecase */
    ]
  });
