"use client";

import { get_shortcut_slug } from "@storiny/shared/src/utils/get-shortcut-slug";
import { useSetAtom as use_set_atom } from "jotai";
import { Options, useHotkeys as use_hot_keys } from "react-hotkeys-hook";

import { sidebars_collapsed_atom } from "../atoms";
import { Alignment } from "../constants";
import { EDITOR_SHORTCUTS } from "../constants/shortcuts";
import { use_alignment } from "../hooks/use-alignment";
import { use_code } from "../hooks/use-code";
import { use_indentation } from "../hooks/use-indentation";
import { use_link } from "../hooks/use-link";
import { use_strikethrough } from "../hooks/use-strikethrough";
import { use_subscript } from "../hooks/use-subscript";
import { use_superscript } from "../hooks/use-superscript";
import { use_text_style } from "../hooks/use-text-style";

const HOTKEYS_OPTIONS: Options = {
  preventDefault: true,
  enableOnContentEditable: true
};

// Sidebars (export this function as this will be present irrespective of
// whether the editor is in read-only mode)

export const use_sidebars_shortcut = (): void => {
  const set_collapsed = use_set_atom(sidebars_collapsed_atom);
  use_hot_keys(
    get_shortcut_slug(EDITOR_SHORTCUTS.sidebars),
    () => set_collapsed((prev) => !prev),
    HOTKEYS_OPTIONS
  );
};

// Alignment

const use_alignment_shortcut = (): void => {
  const [, set_alignment] = use_alignment();

  use_hot_keys(
    [
      EDITOR_SHORTCUTS.left_align,
      EDITOR_SHORTCUTS.center_align,
      EDITOR_SHORTCUTS.right_align,
      EDITOR_SHORTCUTS.justify_align
    ]
      .map(get_shortcut_slug)
      .join(","),
    (_, hotkeys_event) => {
      if (hotkeys_event.keys) {
        switch (hotkeys_event.keys[0]) {
          case EDITOR_SHORTCUTS.left_align.key:
            set_alignment(Alignment.LEFT);
            break;
          case EDITOR_SHORTCUTS.center_align.key:
            set_alignment(Alignment.CENTER);
            break;
          case EDITOR_SHORTCUTS.right_align.key:
            set_alignment(Alignment.RIGHT);
            break;
          case EDITOR_SHORTCUTS.justify_align.key:
            set_alignment(Alignment.JUSTIFY);
            break;
        }
      }
    },
    HOTKEYS_OPTIONS
  );
};

// Text node

const use_text_node_shortcut = (): void => {
  const {
    format_paragraph,
    format_heading,
    format_bulleted_list,
    format_numbered_list,
    format_quote
  } = use_text_style();

  use_hot_keys(
    [
      EDITOR_SHORTCUTS.paragraph,
      EDITOR_SHORTCUTS.heading,
      EDITOR_SHORTCUTS.subheading,
      EDITOR_SHORTCUTS.numbered_list,
      EDITOR_SHORTCUTS.bulleted_list,
      EDITOR_SHORTCUTS.quote
    ]
      .map(get_shortcut_slug)
      .join(","),
    (_, hotkeys_event) => {
      if (hotkeys_event.keys) {
        switch (hotkeys_event.keys[0]) {
          case EDITOR_SHORTCUTS.paragraph.key:
            format_paragraph();
            break;
          case EDITOR_SHORTCUTS.heading.key:
          case EDITOR_SHORTCUTS.subheading.key:
            format_heading(hotkeys_event.shift ? "h3" : "h2");
            break;
          case EDITOR_SHORTCUTS.bulleted_list.key:
            format_bulleted_list();
            break;
          case EDITOR_SHORTCUTS.numbered_list.key:
            format_numbered_list();
            break;
          case EDITOR_SHORTCUTS.quote.key:
            format_quote();
            break;
        }
      }
    },
    HOTKEYS_OPTIONS
  );
};

// Text style

const use_text_style_shortcut = (): void => {
  // Lexical handles bold, italic, and underline styles internally
  const [, toggle_strikethrough] = use_strikethrough();
  const [, toggle_code] = use_code();
  const [, insert_link] = use_link();
  const [, toggle_subscript] = use_subscript();
  const [, toggle_superscript] = use_superscript();

  use_hot_keys(
    [
      EDITOR_SHORTCUTS.strikethrough,
      EDITOR_SHORTCUTS.code,
      EDITOR_SHORTCUTS.link,
      EDITOR_SHORTCUTS.subscript,
      EDITOR_SHORTCUTS.superscript
    ]
      .map(get_shortcut_slug)
      .join(","),
    (_, hotkeys_event) => {
      if (hotkeys_event.keys) {
        switch (hotkeys_event.keys[0]) {
          case EDITOR_SHORTCUTS.strikethrough.key:
            toggle_strikethrough();
            break;
          case EDITOR_SHORTCUTS.code.key:
            toggle_code();
            break;
          case EDITOR_SHORTCUTS.link.key:
            insert_link();
            break;
          case EDITOR_SHORTCUTS.subscript.key:
            toggle_subscript();
            break;
          case EDITOR_SHORTCUTS.superscript.key:
            toggle_superscript();
            break;
        }
      }
    },
    HOTKEYS_OPTIONS
  );
};

// Text indentation

const use_indentation_shortcut = (): void => {
  const { indent, outdent } = use_indentation();
  use_hot_keys(
    [EDITOR_SHORTCUTS.indent, EDITOR_SHORTCUTS.outdent]
      .map(get_shortcut_slug)
      .join(","),
    (_, hotkeys_event) => {
      if (hotkeys_event.keys) {
        switch (hotkeys_event.keys[0]) {
          case EDITOR_SHORTCUTS.indent.key:
            indent();
            break;
          case EDITOR_SHORTCUTS.outdent.key:
            outdent();
            break;
        }
      }
    },
    HOTKEYS_OPTIONS
  );
};

const EditorShortcuts = (): null => {
  use_alignment_shortcut();
  use_text_node_shortcut();
  use_text_style_shortcut();
  use_indentation_shortcut();

  return null;
};

export default EditorShortcuts;
