import { clsx } from "clsx";
import type { EditorThemeClasses } from "lexical";

import linkStyles from "~/components/Link/Link.module.scss";
import typographyStyles from "~/components/Typography/Typography.module.scss";

import styles from "./theme.module.scss";

export const editorTheme: EditorThemeClasses = {
  blockCursor: styles["block-cursor"],
  embedBlock: {
    base: styles["embed-block"],
    focus: clsx(styles["embed-block"], styles.focus)
  },
  // image: "editor-image",
  indent: styles.indent,
  // inlineImage: "inline-editor-image",
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
    code: clsx("t-mono", typographyStyles["inline-code"]),
    italic: styles["t-italic"],
    strikethrough: styles["t-strikethrough"],
    subscript: styles["t-subscript"],
    superscript: styles["t-superscript"],
    underline: styles["t-underline"],
    underlineStrikethrough: styles["t-underline-strikethrough"]
  }
};
