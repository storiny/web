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
        tag: [
          t.keyword,
          t.operatorKeyword,
          t.modifier,
          t.color,
          t.constant(t.name),
          t.standard(t.name),
          t.standard(t.tagName),
          t.special(t.brace),
          t.atom,
          t.bool,
          t.special(t.variableName)
        ],
        color: "#0000ff"
      },
      {
        tag: [t.controlKeyword, t.moduleKeyword],
        color: "#AF00DB"
      },
      {
        tag: [
          t.name,
          t.deleted,
          t.character,
          t.macroName,
          t.propertyName,
          t.variableName,
          t.labelName,
          t.definition(t.name)
        ],
        color: "#001080"
      },
      { tag: t.heading, fontWeight: "bold", color: "#001080" },
      {
        tag: [
          t.typeName,
          t.className,
          t.tagName,
          t.number,
          t.changed,
          t.annotation,
          t.self,
          t.namespace
        ],
        color: "#267f99"
      },
      {
        tag: [t.function(t.variableName), t.function(t.propertyName)],
        color: "#795E26"
      },
      { tag: [t.number], color: "#098658" },
      {
        tag: [
          t.operator,
          t.punctuation,
          t.separator,
          t.url,
          t.escape,
          t.regexp
        ],
        color: "#d16969"
      },
      {
        tag: [
          t.special(t.string),
          t.processingInstruction,
          t.string,
          t.inserted
        ],
        color: "#0451a5"
      },
      { tag: [t.angleBracket], color: "#800000" },
      { tag: t.strong, fontWeight: "bold" },
      { tag: t.emphasis, fontStyle: "italic" },
      { tag: t.strikethrough, textDecoration: "line-through" },
      { tag: [t.meta, t.comment], color: "#008000" },
      { tag: t.link, color: "#008000", textDecoration: "underline" },
      { tag: t.invalid, color: "#cd3131" }
      /* eslint-enable prefer-snakecase/prefer-snakecase */
    ]
  });
