import { Shortcut } from "@storiny/types";

import { IS_APPLE } from "../../browsers";

/**
 * Returns the shortcut key's slug
 * @param shortcut Shortcut
 */
export const get_shortcut_slug = (shortcut: Shortcut): string => {
  const slug: string[] = [];

  if (shortcut.ctrl) {
    slug.push("mod");
  }

  if (shortcut.alt) {
    slug.push(IS_APPLE ? "option" : "alt");
  }

  if (shortcut.shift) {
    slug.push("shift");
  }

  slug.push(shortcut.key);

  return slug.join("+");
};
