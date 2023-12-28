import { tags as t } from "@lezer/highlight";

import { extend_code_block_theme } from "./base";

export const CODE_BLOCK_LIGHT_THEME = extend_code_block_theme({
  mode: "light",
  settings: {
    active_line_background: "rgba(225,228,246,0.3)",
    background: "var(--storiny-palette-background-surface)",
    caret: "#814702",
    fold_marker_filter: "none",
    fold_placeholder: {
      active: {
        background: "var(--storiny-palette-neutral-softActiveBg)",
        color: "var(--storiny-palette-neutral-softActiveColor)"
      },
      background: "var(--storiny-palette-neutral-softBg)",
      color: "var(--storiny-palette-neutral-softColor)",
      hover: {
        background: "var(--storiny-palette-neutral-softHoverBg)",
        color: "var(--storiny-palette-neutral-softHoverColor)"
      }
    },
    foreground: "#000",
    // highlighted_line_background: "rgba(155, 155, 155, 10%)",
    line_numbers: {
      active_color: "#11708d",
      active_shadow: "none",
      color: "#cfd0d0"
    },
    selection: {
      color: "rgba(171,223,245,0.25)",
      match_color: "rgba(144,245,246,0.2)",
      match_outline: "#6bb3ff"
    },
    tooltip_background: "rgba(255,255,255,0.45)"
  },
  styles: [
    /* eslint-disable prefer-snakecase/prefer-snakecase */
    {
      color: "#2175a7",
      tag: [
        t.function(t.variableName),
        t.operatorKeyword,
        t.modifier,
        t.labelName
      ]
    },
    { color: "#2175a7", fontStyle: "italic", tag: t.modifier },
    {
      color: "#8f60e5",
      tag: [t.constant(t.name), t.standard(t.name), t.propertyName]
    },
    {
      color: "#346ca1",
      tag: [t.name]
    },
    {
      color: "#187ba1",
      tag: [t.character, t.macroName],
      textShadow: "0 0 5px #cdfffc, 0 0 0 #c4ffe7"
    },
    {
      color: "#647707",
      tag: [t.className],
      textShadow: "0 0 15px #dce9bb, 0 0 0px #bfff88"
    },
    {
      color: "#2b8403",
      tag: [t.inserted]
    },
    {
      color: "#c05508",
      tag: [
        t.processingInstruction,
        t.string,
        t.special(t.string),
        t.attributeValue
      ]
    },
    {
      color: "#7f93b1",
      fontStyle: "italic",
      tag: [t.attributeName]
    },
    { color: "#5568b3", tag: t.definition(t.name) },
    { color: "#9c9c9c", tag: [t.separator, t.punctuation] },
    {
      color: "#5eae03",
      tag: [t.number]
    },
    {
      color: "#d92828",
      tag: [t.deleted]
    },
    {
      color: "#e61c1c",
      tag: [t.bool]
    },
    { color: "#208338", tag: [t.unit, t.null] },
    {
      color: "#818ea1",
      tag: [t.operator]
    },
    {
      color: "#0d749c",
      tag: [t.url, t.escape, t.regexp, t.link, t.typeName, t.color]
    },
    { color: "#96a5b9", tag: [t.comment, t.blockComment] },
    { color: "#a9b7cb", tag: [t.meta] },
    { color: "#5a638c", fontStyle: "italic", tag: [t.docComment] },
    { color: "#787c99", tag: t.bracket },
    { color: "#667080", tag: [t.angleBracket] },
    { fontWeight: "bold", tag: t.strong },
    { fontStyle: "italic", tag: t.emphasis },
    { tag: t.link, textDecoration: "underline" },
    { color: "#4c6388", tag: t.tagName },
    { color: "#0b182d", fontStyle: "italic", tag: t.keyword },
    { color: "#778000", tag: t.heading },
    { color: "#0d1a3f", tag: [t.atom] },
    { color: "#45779a", tag: [t.special(t.variableName)] },
    { color: "#ff5370", tag: t.invalid },
    { tag: t.strikethrough, textDecoration: "line-through" }
    /* eslint-enable prefer-snakecase/prefer-snakecase */
  ]
});
