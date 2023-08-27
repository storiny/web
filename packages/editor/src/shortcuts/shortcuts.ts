"use client";

import { getShortcutSlug } from "@storiny/shared/src/utils/get-shortcut-slug";
import { useSetAtom } from "jotai";
import { Options, useHotkeys } from "react-hotkeys-hook";

import { sidebarsCollapsedAtom } from "../atoms";
import { Alignment } from "../constants";
import { EDITOR_SHORTCUTS } from "../constants/shortcuts";
import { useAlignment } from "../hooks/useAlignment";
import { useCode } from "../hooks/useCode";
import { useIndentation } from "../hooks/useIndentation";
import { useLink } from "../hooks/useLink";
import { useStrikethrough } from "../hooks/useStrikethrough";
import { useSubscript } from "../hooks/useSubscript";
import { useSuperscript } from "../hooks/useSuperscript";
import { useTextStyle } from "../hooks/useTextStyle";

const hotkeysOptions: Options = {
  preventDefault: true,
  enableOnContentEditable: true
};

// Sidebars

const useSidebarsShortcut = (): void => {
  const setCollapsed = useSetAtom(sidebarsCollapsedAtom);
  useHotkeys(
    getShortcutSlug(EDITOR_SHORTCUTS.sidebars),
    () => setCollapsed((prev) => !prev),
    hotkeysOptions
  );
};

// Alignment

const useAlignmentShortcut = (): void => {
  const [, setAlignment] = useAlignment();

  useHotkeys(
    [
      EDITOR_SHORTCUTS.leftAlign,
      EDITOR_SHORTCUTS.centerAlign,
      EDITOR_SHORTCUTS.rightAlign,
      EDITOR_SHORTCUTS.justifyAlign
    ]
      .map(getShortcutSlug)
      .join(","),
    (_, hotkeysEvent) => {
      if (hotkeysEvent.keys) {
        switch (hotkeysEvent.keys[0]) {
          case EDITOR_SHORTCUTS.leftAlign.key:
            setAlignment(Alignment.LEFT);
            break;
          case EDITOR_SHORTCUTS.centerAlign.key:
            setAlignment(Alignment.CENTER);
            break;
          case EDITOR_SHORTCUTS.rightAlign.key:
            setAlignment(Alignment.RIGHT);
            break;
          case EDITOR_SHORTCUTS.justifyAlign.key:
            setAlignment(Alignment.JUSTIFY);
            break;
        }
      }
    },
    hotkeysOptions
  );
};

// Text node

const useTextNodeShortcut = (): void => {
  const {
    formatParagraph,
    formatHeading,
    formatBulletedList,
    formatNumberedList,
    formatQuote
  } = useTextStyle();

  useHotkeys(
    [
      EDITOR_SHORTCUTS.paragraph,
      EDITOR_SHORTCUTS.heading,
      EDITOR_SHORTCUTS.subheading,
      EDITOR_SHORTCUTS.numberedList,
      EDITOR_SHORTCUTS.bulletedList,
      EDITOR_SHORTCUTS.quote
    ]
      .map(getShortcutSlug)
      .join(","),
    (_, hotkeysEvent) => {
      if (hotkeysEvent.keys) {
        switch (hotkeysEvent.keys[0]) {
          case EDITOR_SHORTCUTS.paragraph.key:
            formatParagraph();
            break;
          case EDITOR_SHORTCUTS.heading.key:
          case EDITOR_SHORTCUTS.subheading.key:
            formatHeading(hotkeysEvent.shift ? "h3" : "h2");
            break;
          case EDITOR_SHORTCUTS.bulletedList.key:
            formatBulletedList();
            break;
          case EDITOR_SHORTCUTS.numberedList.key:
            formatNumberedList();
            break;
          case EDITOR_SHORTCUTS.quote.key:
            formatQuote();
            break;
        }
      }
    },
    hotkeysOptions
  );
};

// Text style

const useTextStyleShortcut = (): void => {
  // Lexical handles bold, italic, and underline styles internally
  const [, toggleStrikethrough] = useStrikethrough();
  const [, toggleCode] = useCode();
  const [, insertLink] = useLink();
  const [, toggleSubscript] = useSubscript();
  const [, toggleSuperscript] = useSuperscript();

  useHotkeys(
    [
      EDITOR_SHORTCUTS.strikethrough,
      EDITOR_SHORTCUTS.code,
      EDITOR_SHORTCUTS.link,
      EDITOR_SHORTCUTS.subscript,
      EDITOR_SHORTCUTS.superscript
    ]
      .map(getShortcutSlug)
      .join(","),
    (_, hotkeysEvent) => {
      if (hotkeysEvent.keys) {
        switch (hotkeysEvent.keys[0]) {
          case EDITOR_SHORTCUTS.strikethrough.key:
            toggleStrikethrough();
            break;
          case EDITOR_SHORTCUTS.code.key:
            toggleCode();
            break;
          case EDITOR_SHORTCUTS.link.key:
            insertLink();
            break;
          case EDITOR_SHORTCUTS.subscript.key:
            toggleSubscript();
            break;
          case EDITOR_SHORTCUTS.superscript.key:
            toggleSuperscript();
            break;
        }
      }
    },
    hotkeysOptions
  );
};

// Text indentation

const useIndentationShortcut = (): void => {
  const { indent, outdent } = useIndentation();
  useHotkeys(
    [EDITOR_SHORTCUTS.indent, EDITOR_SHORTCUTS.outdent]
      .map(getShortcutSlug)
      .join(","),
    (_, hotkeysEvent) => {
      if (hotkeysEvent.keys) {
        switch (hotkeysEvent.keys[0]) {
          case EDITOR_SHORTCUTS.indent.key:
            indent();
            break;
          case EDITOR_SHORTCUTS.outdent.key:
            outdent();
            break;
        }
      }
    },
    hotkeysOptions
  );
};

const EditorShortcuts = (): null => {
  useSidebarsShortcut();
  useAlignmentShortcut();
  useTextNodeShortcut();
  useTextStyleShortcut();
  useIndentationShortcut();

  return null;
};

export default EditorShortcuts;
