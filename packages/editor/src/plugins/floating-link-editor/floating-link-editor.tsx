"use client";

import { $isLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
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
import React from "react";
import { createPortal } from "react-dom";

import Divider from "../../../../ui/src/components/divider";
import IconButton from "../../../../ui/src/components/icon-button";
import Input from "../../../../ui/src/components/input";
import Link from "../../../../ui/src/components/link";
import EditIcon from "~/icons/Edit";
import LinkIcon from "~/icons/Link";

import { linkAtom } from "../../atoms";
import { useLink } from "../../hooks/use-link";
import { getSelectedNode } from "../../utils/get-selected-node";
import { sanitizeUrl, validateUrl } from "../../utils/sanitize-url";
import { setFloatingElementPosition } from "../../utils/set-floating-element-position";
import floatingElementStyles from "../common/floating-element.module.scss";
import FloatingElementArrow from "../common/floating-element-arrow";
import styles from "./floating-link-editor.module.scss";

const FloatingLinkEditorPopover = (): React.ReactElement => {
  const popoverRef = React.useRef<HTMLDivElement | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [link, insertLink] = useLink();
  const [editor] = useLexicalComposerContext();
  const [linkUrl, setLinkUrl] = React.useState("");
  const [editedLinkUrl, setEditedLinkUrl] = React.useState("");
  const [editMode, setEditMode] = React.useState(false);
  const [lastSelection, setLastSelection] = React.useState<
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
      setFloatingElementPosition(popoverElement, rootElement);
      setLastSelection(selection);
    } else if (
      !activeElement ||
      !activeElement.getAttribute("data-link-input")
    ) {
      if (rootElement !== null) {
        setFloatingElementPosition(popoverElement, rootElement);
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
      if (linkUrl !== "" && validateUrl(editedLinkUrl)) {
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, sanitizeUrl(editedLinkUrl));
      } else {
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
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
        "flex-center",
        floatingElementStyles.x,
        floatingElementStyles["floating-element"],
        styles.x,
        styles["floating-element"],
        editMode && styles["edit-mode"]
      )}
      ref={popoverRef}
    >
      {editMode ? (
        <Input
          autoComplete={"url"}
          data-link-input
          decorator={<LinkIcon />}
          onBlur={(): void => setEditMode(false)}
          onChange={(event): void => setEditedLinkUrl(event.target.value)}
          onFocus={(): void => setEditMode(true)}
          onKeyDown={(event): void => monitorInputInteraction(event)}
          placeholder={"Link"}
          ref={inputRef}
          slot_props={{
            container: {
              className: "f-grow"
            }
          }}
          value={editedLinkUrl}
        />
      ) : (
        <React.Fragment>
          <Link
            className={clsx("f-grow", "ellipsis", styles.x, styles.link)}
            href={sanitizeUrl(linkUrl)}
            level={"body2"}
            target={"_blank"}
            title={sanitizeUrl(linkUrl)}
          >
            {sanitizeUrl(linkUrl)}
          </Link>
          <Divider orientation={"vertical"} />
          <IconButton
            aria-label={"Edit link"}
            className={clsx(styles.x, styles.button)}
            onClick={(): void => {
              setEditedLinkUrl(linkUrl);
              setEditMode(true);
            }}
            title={"Edit link"}
            variant={"ghost"}
          >
            <EditIcon />
          </IconButton>
        </React.Fragment>
      )}
      <FloatingElementArrow />
    </div>
  );
};

const FloatingLinkEditorPlugin = (): React.ReactElement | null => {
  const link = use_atom_value(linkAtom);

  if (!link) {
    return null;
  }

  return createPortal(<FloatingLinkEditorPopover />, document.body);
};

export default FloatingLinkEditorPlugin;
