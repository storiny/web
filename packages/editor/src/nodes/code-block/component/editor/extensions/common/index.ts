import {
  defaultHighlightStyle as default_highlight_style,
  syntaxHighlighting as syntax_highlighting
} from "@codemirror/language";
import { EditorState, Extension } from "@codemirror/state";
import { highlightSpecialChars as highlight_special_chars } from "@codemirror/view";

import { auto_link_extension } from "../auto-link";
import { color_preview_extension } from "../color-preview";

// Maximum length of the code block content.
export const CODE_EDITOR_MAX_LENGTH = 80_000;

export const common_extensions: Extension[] = [
  EditorState.changeFilter.of(
    (tr) => tr.newDoc.length < CODE_EDITOR_MAX_LENGTH
  ),
  highlight_special_chars(),
  color_preview_extension(),
  auto_link_extension(),
  syntax_highlighting(default_highlight_style, { fallback: true })
];
