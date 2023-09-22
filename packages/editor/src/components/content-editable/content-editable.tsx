import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { clsx } from "clsx";
import React from "react";

import { useLayoutEffect } from "../../hooks/use-layout-effect";
import styles from "./content-editable.module.scss";
import { EditorContentEditableProps } from "./content-editable.props";

const EditorContentEditable = ({
  ariaActiveDescendant,
  ariaAutoComplete,
  ariaControls,
  ariaDescribedBy,
  ariaExpanded,
  ariaLabel,
  ariaLabelledBy,
  ariaMultiline,
  ariaOwns,
  ariaRequired,
  role = "textbox",
  spellCheck = true,
  className,
  editable,
  ...rest
}: EditorContentEditableProps): React.ReactElement => {
  const [editor] = useLexicalComposerContext();
  const [isEditable, setEditable] = React.useState<boolean>(false);
  const ref = React.useCallback(
    (rootElement: null | HTMLElement) => {
      editor.setRootElement(rootElement);
    },
    [editor]
  );

  useLayoutEffect(() => {
    setEditable(editor.isEditable());
    return editor.registerEditableListener((currentIsEditable) => {
      setEditable(currentIsEditable);
    });
  }, [editor]);

  return (
    <main
      {...rest}
      aria-activedescendant={!isEditable ? undefined : ariaActiveDescendant}
      aria-autocomplete={!isEditable ? "none" : ariaAutoComplete}
      aria-controls={!isEditable ? undefined : ariaControls}
      aria-describedby={ariaDescribedBy}
      aria-expanded={
        !isEditable
          ? undefined
          : role === "combobox"
          ? !!ariaExpanded
          : undefined
      }
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-multiline={ariaMultiline}
      aria-owns={!isEditable ? undefined : ariaOwns}
      aria-readonly={!isEditable ? true : undefined}
      aria-required={ariaRequired}
      className={clsx(
        "t-legible",
        "t-legible-fg",
        styles["content-editable"],
        editable && styles.editable,
        className
      )}
      contentEditable={isEditable}
      ref={ref}
      spellCheck={spellCheck}
    />
  );
};

export default EditorContentEditable;
