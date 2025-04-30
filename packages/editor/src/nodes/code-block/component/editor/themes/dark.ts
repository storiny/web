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
        tag: [t.keyword, t.controlKeyword, t.operatorKeyword, t.moduleKeyword],
        color: "#f38ba8"
      },
      {
        tag: [t.operator, t.punctuation, t.separator, t.escape],
        color: "#cdd6f4"
      },
      { tag: [t.variableName], color: "#cdd6f4" },
      { tag: [t.propertyName], color: "#f2cdcd" },
      {
        tag: [t.constant(t.name), t.bool, t.atom, t.special(t.variableName)],
        color: "#fab387"
      },
      { tag: [t.string, t.special(t.string), t.inserted], color: "#a6e3a1" },
      { tag: [t.number], color: "#f9e2af" },
      {
        tag: [t.typeName, t.className, t.namespace, t.tagName],
        color: "#89b4fa"
      },
      {
        tag: [t.function(t.variableName), t.function(t.propertyName)],
        color: "#cba6f7"
      },
      { tag: [t.labelName, t.macroName], color: "#f5c2e7" },
      { tag: [t.heading], color: "#b4befe", fontWeight: "bold" },
      { tag: [t.comment, t.meta], color: "#6c7086", fontStyle: "italic" },
      { tag: [t.link], color: "#89dceb", textDecoration: "underline" },
      { tag: [t.regexp], color: "#94e2d5" },
      { tag: [t.annotation], color: "#f9e2af" },
      { tag: [t.changed], color: "#f9e2af" },
      { tag: [t.deleted], color: "#eba0ac" },
      { tag: [t.invalid], color: "#f38ba8" },
      { tag: [t.angleBracket], color: "#89b4fa" },
      // Bold, italic, strikethrough formatting
      { tag: [t.strong], fontWeight: "bold" },
      { tag: [t.emphasis], fontStyle: "italic" },
      { tag: [t.strikethrough], textDecoration: "line-through" }
      /* eslint-enable prefer-snakecase/prefer-snakecase */
    ]
  });
