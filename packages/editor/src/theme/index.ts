import { clsx } from "clsx";
import type { EditorThemeClasses } from "lexical";

import link_styles from "~/components/link/link.module.scss";
import typography_styles from "~/components/typography/typography.module.scss";
import css from "~/theme/main.module.scss";

import styles from "./theme.module.scss";

export const EDITOR_THEME: EditorThemeClasses = {
  blockCursor: styles["block-cursor"],
  embedBlock: {
    base: styles["embed-block"],
    focus: clsx(styles["embed-block"], styles.focus)
  },
  indent: styles.indent,
  link: clsx(
    css["focusable"],
    link_styles.link,
    link_styles["color-beryl"],
    link_styles["underline-hover"],
    styles.link
  ),
  list: {
    listitem: styles.li,
    nested: {
      listitem: styles["nested-li"]
    },
    olDepth: [styles.ol, styles["ol-2"], styles["ol-3"]],
    ul: styles.ul
  },
  paragraph: styles.paragraph,
  text: {
    bold: css["t-bold"],
    code: clsx(css["t-mono"], typography_styles["inline-code"]),
    italic: styles["t-italic"],
    strikethrough: styles["t-strikethrough"],
    subscript: styles["t-subscript"],
    superscript: styles["t-superscript"],
    underline: styles["t-underline"],
    underlineStrikethrough: styles["t-underline-strikethrough"]
  }
};
