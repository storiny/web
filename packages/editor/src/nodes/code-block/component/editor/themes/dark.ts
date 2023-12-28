import { tags as t } from "@lezer/highlight";

import { extend_code_block_theme } from "./base";

export const CODE_BLOCK_DARK_THEME = extend_code_block_theme({
  mode: "dark",
  settings: {
    active_line_background: "rgba(67 72 111 / 30%)",
    background: "#0f0f10",
    caret: "#ffa846",
    fold_marker_filter: "invert(1)",
    fold_placeholder: {
      active: {
        background: "var(--storiny-palette-neutral-solidActiveBg)",
        color: "var(--storiny-palette-neutral-solidActiveColor)"
      },
      background: "var(--storiny-palette-neutral-solidBg)",
      color: "var(--storiny-palette-neutral-solidColor)",
      hover: {
        background: "var(--storiny-palette-neutral-solidHoverBg)",
        color: "var(--storiny-palette-neutral-solidHoverColor)"
      }
    },
    foreground: "#dde1f3",
    // highlightedLineBackground: "rgba(217, 246, 10, 0.1)",
    line_numbers: {
      active_color: "#ffba00",
      active_shadow: "0 0 10px #ffba00, 0 0 0 #de6d0d",
      color: "#464d56"
    },
    selection: {
      color: "rgba(192,154,111,0.25)",
      match_color: "rgba(56,204,206,0.2)",
      match_outline: "#2592ff"
    },
    tooltip_background: "rgba(0,0,0,0.15)"
  },
  styles: [
    /* eslint-disable prefer-snakecase/prefer-snakecase */
    {
      color: "#e5fb79",
      tag: [t.function(t.variableName), t.operatorKeyword, t.labelName],
      textShadow: "0 0 5px #6e6f1338, 0 0 5px #b3b0224a"
    },
    { color: "#d8ec74", fontStyle: "italic", tag: t.modifier },
    {
      color: "#bb9af7",
      tag: [t.constant(t.name), t.standard(t.name)]
    },
    {
      color: "#e0f0ff",
      tag: [t.name]
    },
    {
      color: "#8cdfff",
      tag: [t.character, t.macroName],
      textShadow: "0 0 30px #00fff0, 0 0 0 #00ff9a"
    },
    {
      color: "#dcff38",
      tag: [t.className],
      textShadow: "0 0 30px #b7ff00, 0 0 0px #77ff00"
    },
    {
      color: "#95ec36",
      tag: [t.inserted]
    },
    {
      color: "#f6a66c",
      tag: [
        t.processingInstruction,
        t.string,
        t.special(t.string),
        t.attributeValue
      ]
    },
    {
      color: "#8ec9ff",
      tag: [t.propertyName]
    },
    {
      color: "#c7d6ec",
      fontStyle: "italic",
      tag: [t.attributeName]
    },
    { color: "#dde3fc", tag: t.definition(t.name) },
    { color: "#9c9c9c", tag: [t.separator, t.punctuation] },
    {
      color: "#a3ff39",
      tag: [t.number],
      textShadow: "0 0 5px #17ff0075, 0 0 5px #e8ff003d"
    },
    {
      color: "#ff4141",
      tag: [t.deleted]
    },
    {
      color: "#ff4141",
      tag: [t.bool]
    },
    { color: "#88d39a", tag: [t.unit, t.null] },
    {
      color: "#818ea1",
      tag: [t.operator]
    },
    {
      color: "#3cc9ff",
      tag: [t.url, t.escape, t.regexp, t.link, t.typeName, t.color],
      textShadow: "0 0 5px #00fffa26, 0 0 5px #00f9ff38"
    },
    { color: "#707985", tag: [t.comment, t.blockComment] },
    { color: "#5d6e85", tag: [t.meta] },
    { color: "#5a638c", fontStyle: "italic", tag: [t.docComment] },
    { color: "#9194aa", tag: t.bracket },
    { color: "#59677b", tag: [t.angleBracket] },
    { fontWeight: "bold", tag: t.strong },
    { fontStyle: "italic", tag: t.emphasis },
    { tag: t.link, textDecoration: "underline" },
    { color: "#9ab6de", tag: t.tagName },
    { color: "#9ab6de", fontStyle: "italic", tag: t.keyword },
    { color: "#f3ff89", tag: t.heading },
    { color: "#e9eefd", tag: [t.atom] },
    { color: "#c0caf5", tag: [t.special(t.variableName)] },
    { color: "#ff5370", tag: t.invalid },
    { tag: t.strikethrough, textDecoration: "line-through" }
    /* eslint-enable prefer-snakecase/prefer-snakecase */
  ]
});
