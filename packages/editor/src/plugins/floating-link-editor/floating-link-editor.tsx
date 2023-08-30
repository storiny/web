import { $isLinkNode } from "@lexical/link";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import { clsx } from "clsx";
import { useAtomValue } from "jotai";
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  GridSelection,
  KEY_ESCAPE_COMMAND,
  NodeSelection,
  RangeSelection,
  SELECTION_CHANGE_COMMAND
} from "lexical";
import { useState } from "react";
import React from "react";
import { createPortal } from "react-dom";

import IconButton from "~/components/IconButton";
import Input from "~/components/Input";
import CheckIcon from "~/icons/Check";
import LinkIcon from "~/icons/Link";
import TrashIcon from "~/icons/Trash";

import { linkAtom } from "../../atoms";
import { useLink } from "../../hooks/use-link";
import { getSelectedNode } from "../../utils/get-selected-node";
import { setFloatingElementPosition } from "../../utils/set-floating-element-position";
import floatingElementStyles from "../common/floating-element.module.scss";
import styles from "./floating-link-editor.module.scss";

const FloatingLinkEditorPopover = (): React.ReactElement => {
  const popoverRef = React.useRef<HTMLDivElement | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [link, insertLink] = useLink();
  const [editor] = useLexicalComposerContext();
  const [linkUrl, setLinkUrl] = useState("");
  const [editedLinkUrl, setEditedLinkUrl] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [lastSelection, setLastSelection] = useState<
    RangeSelection | GridSelection | NodeSelection | null
  >(null);

  /**
   * Updates the link editor position
   */
  const updateLinkEditor = React.useCallback(() => {
    const selection = $getSelection();

    if ($isRangeSelection(selection)) {
      const node = getSelectedNode(selection);
      const parent = node.getParent();

      if ($isLinkNode(parent)) {
        setLinkUrl(parent.getURL());
      } else if ($isLinkNode(node)) {
        setLinkUrl(node.getURL());
      } else {
        setLinkUrl("");
      }
    }

    const popoverElement = popoverRef.current;
    const nativeSelection = window.getSelection();
    const activeElement = document.activeElement;

    if (popoverElement === null) {
      return;
    }

    const rootElement = editor.getRootElement();

    if (
      selection !== null &&
      nativeSelection !== null &&
      rootElement !== null &&
      rootElement.contains(nativeSelection.anchorNode) &&
      editor.isEditable()
    ) {
      setFloatingElementPosition(
        popoverElement,
        rootElement.getBoundingClientRect()
      );
      setLastSelection(selection);
    } else if (
      !activeElement ||
      !activeElement.getAttribute("data-link-input")
    ) {
      if (rootElement !== null) {
        setFloatingElementPosition(
          popoverElement,
          rootElement.getBoundingClientRect()
        );
      }

      setLastSelection(null);
      setEditMode(false);
      setLinkUrl("");
    }

    return true;
  }, [editor]);

  /**
   * Monitors input events
   * @param event Event
   */
  const monitorInputInteraction = (
    event: React.KeyboardEvent<HTMLInputElement>
  ): void => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleLinkSubmission();
    } else if (event.key === "Escape") {
      event.preventDefault();
      setEditMode(false);
    }
  };

  /**
   * Handles link submission
   */
  const handleLinkSubmission = (): void => {
    if (lastSelection !== null) {
      if (linkUrl !== "") {
        insertLink(editedLinkUrl);
      }

      setEditMode(false);
      inputRef.current?.blur?.();
    }
  };

  React.useEffect(() => {
    editor.getEditorState().read(updateLinkEditor);
  }, [editor, updateLinkEditor]);

  React.useEffect(() => {
    if (editMode) {
      inputRef.current?.focus?.();
    }
  }, [editMode]);

  React.useEffect(() => {
    const update = (): void => {
      editor.getEditorState().read(updateLinkEditor);
    };

    window.addEventListener("resize", update);
    document.body.addEventListener("scroll", update);

    return () => {
      window.removeEventListener("resize", update);
      document.body.removeEventListener("scroll", update);
    };
  }, [editor, updateLinkEditor]);

  React.useEffect(
    () =>
      mergeRegister(
        editor.registerUpdateListener(({ editorState }) =>
          editorState.read(updateLinkEditor)
        ),
        editor.registerCommand(
          SELECTION_CHANGE_COMMAND,
          () => {
            updateLinkEditor();
            return true;
          },
          COMMAND_PRIORITY_LOW
        ),
        editor.registerCommand(
          KEY_ESCAPE_COMMAND,
          () => {
            if (link) {
              insertLink();
              return true;
            }

            return false;
          },
          COMMAND_PRIORITY_HIGH
        )
      ),
    [editor, insertLink, link, updateLinkEditor]
  );

  return (
    <div
      className={clsx(
        floatingElementStyles.x,
        floatingElementStyles["floating-element"],
        styles.x,
        styles["floating-element"]
      )}
      ref={popoverRef}
    >
      <Input
        autoComplete={"url"}
        data-link-input
        decorator={<LinkIcon />}
        endDecorator={
          <IconButton
            aria-label={editMode ? "Confirm link" : "Remove link"}
            onClick={(): void => {
              if (editMode) {
                handleLinkSubmission();
              } else {
                insertLink();
              }
            }}
            title={editMode ? "Confirm link" : "Remove link"}
          >
            {editMode ? <CheckIcon /> : <TrashIcon />}
          </IconButton>
        }
        onBlur={(): void => setEditMode(false)}
        onChange={(event): void => setEditedLinkUrl(event.target.value)}
        onFocus={(): void => setEditMode(true)}
        onKeyDown={(event): void => monitorInputInteraction(event)}
        placeholder={"Link"}
        ref={inputRef}
        slotProps={{
          container: {
            className: clsx(styles.x, styles.input)
          }
        }}
        value={editedLinkUrl}
      />
    </div>
  );
};

const FloatingLinkEditorPlugin = (): React.ReactElement | null => {
  const link = useAtomValue(linkAtom);

  if (!link) {
    return null;
  }

  return createPortal(<FloatingLinkEditorPopover />, document.body);
};

export default FloatingLinkEditorPlugin;
