import { Extension } from "@codemirror/state";
import { tags as t } from "@lezer/highlight";

import { extend_code_block_theme } from "./base";

export const CODE_BLOCK_LIGHT_THEME = (read_only: boolean): Extension =>
  extend_code_block_theme({
    mode: "light",
    read_only,
    styles: [
      {
        tag: [t.keyword, t.controlKeyword, t.operatorKeyword, t.moduleKeyword],
        color: "#d20f39"
      },
      {
        tag: [t.operator, t.punctuation, t.separator, t.escape],
        color: "#4c4f69"
      },
      { tag: [t.variableName], color: "#4c4f69" },
      { tag: [t.propertyName], color: "#dd7878" },
      {
        tag: [t.constant(t.name), t.bool, t.atom, t.special(t.variableName)],
        color: "#fe640b"
      },
      { tag: [t.string, t.special(t.string), t.inserted], color: "#40a02b" },
      { tag: [t.number], color: "#df8e1d" },
      {
        tag: [t.typeName, t.className, t.namespace, t.tagName],
        color: "#1e66f5"
      },
      {
        tag: [t.function(t.variableName), t.function(t.propertyName)],
        color: "#8839ef"
      },
      { tag: [t.labelName, t.macroName], color: "#ea76cb" },
      { tag: [t.heading], color: "#7287fd", fontWeight: "bold" },
      { tag: [t.comment, t.meta], color: "#9ca0b0", fontStyle: "italic" },
      { tag: [t.link], color: "#04a5e5", textDecoration: "underline" },
      { tag: [t.regexp], color: "#179299" },
      { tag: [t.annotation], color: "#df8e1d" },
      { tag: [t.changed], color: "#df8e1d" },
      { tag: [t.deleted], color: "#e64553" },
      { tag: [t.invalid], color: "#d20f39" },
      { tag: [t.angleBracket], color: "#1e66f5" },
      // Bold, italic, strikethrough formatting
      { tag: [t.strong], fontWeight: "bold" },
      { tag: [t.emphasis], fontStyle: "italic" },
      { tag: [t.strikethrough], textDecoration: "line-through" }
    ]
  });
