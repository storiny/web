"use client";

import {
  $isLinkNode as $is_link_node,
  TOGGLE_LINK_COMMAND
} from "@lexical/link";
import { useLexicalComposerContext as use_lexical_composer_context } from "@lexical/react/LexicalComposerContext";
import { mergeRegister as merge_register } from "@lexical/utils";
import { clsx } from "clsx";
import { useAtomValue as use_atom_value } from "jotai";
import {
  $getSelection as $get_selection,
  $isRangeSelection as $is_range_selection,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  GridSelection,
  KEY_ESCAPE_COMMAND,
  NodeSelection,
  RangeSelection,
  SELECTION_CHANGE_COMMAND
} from "lexical";
import React from "react";
import { createPortal as create_portal } from "react-dom";

import Divider from "~/components/divider";
import IconButton from "~/components/icon-button";
import Input from "~/components/input";
import Link from "~/components/link";
import EditIcon from "~/icons/edit";
import LinkIcon from "~/icons/link";

import { link_atom } from "../../atoms";
import { use_link } from "../../hooks/use-link";
import { get_selected_node } from "../../utils/get-selected-node";
import { sanitize_url, validate_url } from "../../utils/sanitize-url";
import { set_floating_element_position } from "../../utils/set-floating-element-position";
import floating_element_styles from "../common/floating-element.module.scss";
import FloatingElementArrow from "../common/floating-element-arrow";
import styles from "./floating-link-editor.module.scss";

const FloatingLinkEditorPopover = (): React.ReactElement => {
  const popover_ref = React.useRef<HTMLDivElement | null>(null);
  const input_ref = React.useRef<HTMLInputElement | null>(null);
  const [link, insert_link] = use_link();
  const [editor] = use_lexical_composer_context();
  const [link_url, set_link_url] = React.useState("");
  const [edited_link_url, set_edited_link_url] = React.useState("");
  const [edit_mode, set_edit_mode] = React.useState(false);
  const [last_selection, set_last_selection] = React.useState<
    RangeSelection | GridSelection | NodeSelection | null
  >(null);

  /**
   * Updates the link editor position
   */
  const update_link_editor = React.useCallback(() => {
    const selection = $get_selection();

    if ($is_range_selection(selection)) {
      const node = get_selected_node(selection);
      const parent = node.getParent();

      if ($is_link_node(parent)) {
        set_link_url(parent.getURL());
      } else if ($is_link_node(node)) {
        set_link_url(node.getURL());
      } else {
        set_link_url("");
      }
    }

    const popover_element = popover_ref.current;
    const native_selection = window.getSelection();
    const active_element = document.activeElement;

    if (popover_element === null) {
      return;
    }

    const root_element = editor.getRootElement();

    if (
      selection !== null &&
      native_selection !== null &&
      root_element !== null &&
      root_element.contains(native_selection.anchorNode) &&
      editor.isEditable()
    ) {
      set_floating_element_position(popover_element, root_element);
      set_last_selection(selection);
    } else if (
      !active_element ||
      !active_element.getAttribute("data-link-input")
    ) {
      if (root_element !== null) {
        set_floating_element_position(popover_element, root_element);
      }

      set_last_selection(null);
      set_edit_mode(false);
      set_link_url("");
    }

    return true;
  }, [editor]);

  /**
   * Monitors input events
   * @param event Event
   */
  const monitor_input_interaction = (
    event: React.KeyboardEvent<HTMLInputElement>
  ): void => {
    if (event.key === "Enter") {
      event.preventDefault();
      handle_link_submission();
    } else if (event.key === "Escape") {
      event.preventDefault();
      set_edit_mode(false);
    }
  };

  /**
   * Handles link submission
   */
  const handle_link_submission = (): void => {
    if (last_selection !== null) {
      if (link_url !== "" && validate_url(edited_link_url)) {
        editor.dispatchCommand(
          TOGGLE_LINK_COMMAND,
          sanitize_url(edited_link_url)
        );
      } else {
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
      }

      set_edit_mode(false);
      input_ref.current?.blur?.();
    }
  };

  React.useEffect(() => {
    editor.getEditorState().read(update_link_editor);
  }, [editor, update_link_editor]);

  React.useEffect(() => {
    if (edit_mode) {
      input_ref.current?.focus?.();
    }
  }, [edit_mode]);

  React.useEffect(() => {
    const update = (): void => {
      editor.getEditorState().read(update_link_editor);
    };

    window.addEventListener("resize", update);
    document.body.addEventListener("scroll", update);

    return () => {
      window.removeEventListener("resize", update);
      document.body.removeEventListener("scroll", update);
    };
  }, [editor, update_link_editor]);

  React.useEffect(
    () =>
      merge_register(
        editor.registerUpdateListener(({ editorState: editor_state }) =>
          editor_state.read(update_link_editor)
        ),
        editor.registerCommand(
          SELECTION_CHANGE_COMMAND,
          () => {
            update_link_editor();
            return true;
          },
          COMMAND_PRIORITY_LOW
        ),
        editor.registerCommand(
          KEY_ESCAPE_COMMAND,
          () => {
            if (link) {
              insert_link();
              return true;
            }

            return false;
          },
          COMMAND_PRIORITY_HIGH
        )
      ),
    [editor, insert_link, link, update_link_editor]
  );

  return (
    <div
      className={clsx(
        "flex-center",
        floating_element_styles.x,
        floating_element_styles["floating-element"],
        styles.x,
        styles["floating-element"],
        edit_mode && styles["edit-mode"]
      )}
      ref={popover_ref}
    >
      {edit_mode ? (
        <Input
          autoComplete={"url"}
          data-link-input
          decorator={<LinkIcon />}
          onBlur={(): void => set_edit_mode(false)}
          onChange={(event): void => set_edited_link_url(event.target.value)}
          onFocus={(): void => set_edit_mode(true)}
          onKeyDown={(event): void => monitor_input_interaction(event)}
          placeholder={"Link"}
          ref={input_ref}
          slot_props={{
            container: {
              className: "f-grow"
            }
          }}
          value={edited_link_url}
        />
      ) : (
        <React.Fragment>
          <Link
            className={clsx("f-grow", "ellipsis", styles.x, styles.link)}
            href={sanitize_url(link_url)}
            level={"body2"}
            target={"_blank"}
            title={sanitize_url(link_url)}
          >
            {sanitize_url(link_url)}
          </Link>
          <Divider orientation={"vertical"} />
          <IconButton
            aria-label={"Edit link"}
            className={clsx(styles.x, styles.button)}
            onClick={(): void => {
              set_edited_link_url(link_url);
              set_edit_mode(true);
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
  const link = use_atom_value(link_atom);

  if (!link) {
    return null;
  }

  return create_portal(<FloatingLinkEditorPopover />, document.body);
};

export default FloatingLinkEditorPlugin;
