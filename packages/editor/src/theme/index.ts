import { clsx } from "clsx";
import type { EditorThemeClasses } from "lexical";

import linkStyles from "~/components/link/link.module.scss";
import typography_styles from "~/components/typography/typography.module.scss";

import styles from "./theme.module.scss";

export const editorTheme: EditorThemeClasses = {
  blockCursor: styles["block-cursor"],
  embedBlock: {
    base: styles["embed-block"],
    focus: clsx(styles["embed-block"], styles.focus)
  },
  indent: styles.indent,
  link: clsx(
    "focusable",
    linkStyles.link,
    linkStyles["color-beryl"],
    linkStyles["underline-hover"],
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
    bold: "t-bold",
    code: clsx("t-mono", typography_styles["inline-code"]),
    italic: styles["t-italic"],
    strikethrough: styles["t-strikethrough"],
    subscript: styles["t-subscript"],
    superscript: styles["t-superscript"],
    underline: styles["t-underline"],
    underlineStrikethrough: styles["t-underline-strikethrough"]
  }
};
