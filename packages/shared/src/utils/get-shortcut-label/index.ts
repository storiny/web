import { Shortcut } from "@storiny/types";

import { IS_APPLE } from "../../browsers";

/**
 * Returns the shortcut key's label
 * @param shortcut Shortcut
 */
export const get_shortcut_label = (shortcut: Shortcut): string => {
  const display_name: string[] = [];

  if (shortcut.ctrl) {
    display_name.push(IS_APPLE ? "⌘" : "Ctrl");
  }

  if (shortcut.shift) {
    display_name.push(IS_APPLE ? "⇧" : "Shift");
  }

  if (shortcut.alt) {
    display_name.push(IS_APPLE ? "⌥" : "Alt");
  }

  display_name.push(shortcut.key.toUpperCase());

  return display_name.join("+");
};
