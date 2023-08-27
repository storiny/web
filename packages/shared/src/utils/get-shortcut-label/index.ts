import { Shortcut } from "@storiny/types";

import { IS_APPLE } from "../../browsers";

/**
 * Returns the shortcut key's label
 * @param shortcut Shortcut
 */
export const getShortcutLabel = (shortcut: Shortcut): string => {
  const displayName: string[] = [];

  if (shortcut.ctrl) {
    displayName.push(IS_APPLE ? "⌘" : "Ctrl");
  }

  if (shortcut.shift) {
    displayName.push(IS_APPLE ? "⇧" : "Shift");
  }

  if (shortcut.alt) {
    displayName.push(IS_APPLE ? "⌥" : "Alt");
  }

  displayName.push(shortcut.key.toUpperCase());

  return displayName.join("+");
};
