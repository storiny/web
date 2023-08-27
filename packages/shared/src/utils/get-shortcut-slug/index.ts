import { Shortcut } from "@storiny/types";

import { IS_APPLE } from "../../browsers";

/**
 * Returns the shortcut key's slug
 * @param shortcut Shortcut
 */
export const getShortcutSlug = (shortcut: Shortcut): string => {
  const slug: string[] = [];

  if (shortcut.ctrl) {
    slug.push(IS_APPLE ? "cmd" : "ctrl");
  }

  if (shortcut.alt) {
    slug.push(IS_APPLE ? "opt" : "alt");
  }

  if (shortcut.shift) {
    slug.push("shift");
  }

  slug.push(shortcut.key);

  return slug.join("+");
};
