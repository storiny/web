import { ContentEditable as ContentEditablePrimitive } from "@lexical/react/LexicalContentEditable";
import { clsx } from "clsx";
import React from "react";

import styles from "./content-editable.module.scss";

const EditorContentEditable = ({
  className,
  editable
}: {
  className?: string;
  editable?: boolean;
}): React.ReactElement => (
  <ContentEditablePrimitive
    className={clsx(
      "t-legible",
      "t-legible-fg",
      styles["content-editable"],
      editable && styles.editable,
      className
    )}
  />
);

export default EditorContentEditable;
