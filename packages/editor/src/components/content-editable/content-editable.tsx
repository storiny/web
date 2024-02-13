import { useLexicalComposerContext as use_lexical_composer_context } from "@lexical/react/LexicalComposerContext";
import { clsx } from "clsx";
import React from "react";

import css from "~/theme/main.module.scss";

import { use_layout_effect } from "../../hooks/use-layout-effect";
import styles from "./content-editable.module.scss";
import { EditorContentEditableProps } from "./content-editable.props";

const EditorContentEditable = ({
  role = "textbox",
  spellCheck: spell_check = true,
  className,
  read_only,
  ...rest
}: EditorContentEditableProps): React.ReactElement => {
  const [editor] = use_lexical_composer_context();
  const [is_editable, set_editable] = React.useState<boolean>(false);
  const ref = React.useCallback(
    (root_element: null | HTMLElement) => {
      editor.setRootElement(root_element);
    },
    [editor]
  );

  use_layout_effect(() => {
    set_editable(editor.isEditable());
    return editor.registerEditableListener((current_is_editable) => {
      set_editable(current_is_editable);
    });
  }, [editor]);

  return (
    <div
      {...rest}
      aria-activedescendant={
        !is_editable ? undefined : rest["aria-activedescendant"]
      }
      aria-autocomplete={!is_editable ? "none" : rest["aria-autocomplete"]}
      aria-controls={!is_editable ? undefined : rest["aria-controls"]}
      aria-expanded={
        !is_editable
          ? undefined
          : role === "combobox"
            ? !!rest["aria-expanded"]
            : undefined
      }
      aria-owns={!is_editable ? undefined : rest["aria-owns"]}
      aria-readonly={!is_editable ? true : undefined}
      className={clsx(
        css["t-legible"],
        css["t-legible-fg"],
        styles["content-editable"],
        !read_only && styles.editable,
        className
      )}
      contentEditable={is_editable}
      data-editor-content={"true"}
      ref={ref}
      spellCheck={spell_check}
    />
  );
};

export default EditorContentEditable;
