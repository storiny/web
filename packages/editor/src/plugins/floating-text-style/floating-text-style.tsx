"use client";

import { useLexicalComposerContext as use_lexical_composer_context } from "@lexical/react/LexicalComposerContext";
import { mergeRegister as merge_register } from "@lexical/utils";
import { get_shortcut_label } from "@storiny/shared/src/utils/get-shortcut-label";
import { clsx } from "clsx";
import { useAtomValue as use_atom_value } from "jotai";
import {
  $getSelection as $get_selection,
  $isRangeSelection as $is_range_selection,
  $isTextNode as $is_text_node,
  COMMAND_PRIORITY_LOW,
  SELECTION_CHANGE_COMMAND
} from "lexical";
import React from "react";
import { createPortal as create_portal } from "react-dom";

import ToggleGroup from "~/components/toggle-group";
import ToggleGroupItem from "~/components/toggle-group-item";
import BoldIcon from "~/icons/bold";
import ItalicIcon from "~/icons/italic";
import LinkIcon from "~/icons/link";
import UnderlineIcon from "~/icons/underline";

import { link_atom } from "../../atoms";
import { EDITOR_SHORTCUTS } from "../../constants/shortcuts";
import { use_bold } from "../../hooks/use-bold";
import { use_italic } from "../../hooks/use-italic";
import { use_link } from "../../hooks/use-link";
import { use_underline } from "../../hooks/use-underline";
import { get_selected_node } from "../../utils/get-selected-node";
import { set_floating_element_position } from "../../utils/set-floating-element-position";
import floating_element_styles from "../common/floating-element.module.scss";
import FloatingElementArrow from "../common/floating-element-arrow";
import styles from "./floating-text-style.module.scss";

const FloatingTextStylePopover = (): React.ReactElement => {
  const popover_ref = React.useRef<HTMLDivElement | null>(null);
  const [editor] = use_lexical_composer_context();
  const [bold, toggle_bold] = use_bold();
  const [italic, toggle_italic] = use_italic();
  const [underline, toggle_underline] = use_underline();
  const [link, insert_link] = use_link();

  const value = React.useMemo(
    () =>
      [
        bold && "bold",
        italic && "italic",
        underline && "underline",
        link && "link"
      ].filter((item) => typeof item === "string") as string[],
    [bold, italic, link, underline]
  );

  /**
   * Mouse move listener
   * @param event Mouse event
   */
  const mouse_move_listener = (event: MouseEvent): void => {
    if (popover_ref?.current && (event.buttons === 1 || event.buttons === 3)) {
      if (popover_ref.current.style.pointerEvents !== "none") {
        const x = event.clientX;
        const y = event.clientY;
        const element_under_mouse = document.elementFromPoint(x, y);

        if (!popover_ref.current.contains(element_under_mouse)) {
          // Mouse is not over the target element -> not a normal click, but probably a drag
          popover_ref.current.style.pointerEvents = "none";
        }
      }
    }
  };

  /**
   * Mouse up listener
   */
  const mouse_up_listener = (): void => {
    if (
      popover_ref?.current &&
      popover_ref.current.style.pointerEvents !== "auto"
    ) {
      popover_ref.current.style.pointerEvents = "auto";
    }
  };

  /**
   * Updates the popover position
   */
  const update_popover = React.useCallback(() => {
    const selection = $get_selection();
    const popover_element = popover_ref.current;
    const native_selection = window.getSelection();

    if (popover_element === null) {
      return;
    }

    const root_element = editor.getRootElement();

    if (
      selection !== null &&
      native_selection !== null &&
      !native_selection.isCollapsed &&
      root_element !== null &&
      root_element.contains(native_selection.anchorNode)
    ) {
      set_floating_element_position(popover_element, root_element);
    }
  }, [editor]);

  React.useEffect(() => {
    if (popover_ref?.current) {
      document.addEventListener("mousemove", mouse_move_listener);
      document.addEventListener("mouseup", mouse_up_listener);

      return () => {
        document.removeEventListener("mousemove", mouse_move_listener);
        document.removeEventListener("mouseup", mouse_up_listener);
      };
    }
  }, [popover_ref]);

  React.useEffect(() => {
    const update = (): void => {
      editor.getEditorState().read(update_popover);
    };

    window.addEventListener("resize", update);
    document.body.addEventListener("scroll", update);

    return () => {
      window.removeEventListener("resize", update);
      document.body.removeEventListener("scroll", update);
    };
  }, [editor, update_popover]);

  React.useEffect(() => {
    editor.getEditorState().read(update_popover);

    return merge_register(
      editor.registerUpdateListener(({ editorState: editor_state }) => {
        editor_state.read(update_popover);
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          update_popover();
          return false;
        },
        COMMAND_PRIORITY_LOW
      )
    );
  }, [editor, update_popover]);

  return (
    <ToggleGroup
      className={clsx(
        "flex-center",
        floating_element_styles.x,
        floating_element_styles["floating-element"]
      )}
      ref={popover_ref}
      type={"multiple"}
      value={value}
    >
      <ToggleGroupItem
        className={clsx(styles.x, styles.toggle)}
        data-testid={"floating-bold-toggle"}
        onClick={toggle_bold}
        slot_props={{
          tooltip: {
            right_slot: get_shortcut_label(EDITOR_SHORTCUTS.bold)
          }
        }}
        tooltip_content={"Bold"}
        value={"bold"}
      >
        <BoldIcon />
      </ToggleGroupItem>
      <ToggleGroupItem
        className={clsx(styles.x, styles.toggle)}
        data-testid={"floating-italic-toggle"}
        onClick={toggle_italic}
        slot_props={{
          tooltip: {
            right_slot: get_shortcut_label(EDITOR_SHORTCUTS.italic)
          }
        }}
        tooltip_content={"Italic"}
        value={"italic"}
      >
        <ItalicIcon />
      </ToggleGroupItem>
      <ToggleGroupItem
        className={clsx(styles.x, styles.toggle)}
        data-testid={"floating-underline-toggle"}
        onClick={toggle_underline}
        slot_props={{
          tooltip: {
            right_slot: get_shortcut_label(EDITOR_SHORTCUTS.underline)
          }
        }}
        tooltip_content={"Underline"}
        value={"underline"}
      >
        <UnderlineIcon />
      </ToggleGroupItem>
      <ToggleGroupItem
        className={clsx(styles.x, styles.toggle)}
        data-testid={"floating-link-toggle"}
        onClick={(): void => insert_link()}
        slot_props={{
          tooltip: {
            right_slot: get_shortcut_label(EDITOR_SHORTCUTS.link)
          }
        }}
        tooltip_content={"Link"}
        value={"link"}
      >
        <LinkIcon />
      </ToggleGroupItem>
      <FloatingElementArrow />
    </ToggleGroup>
  );
};

const FloatingTextStylePlugin = (): React.ReactElement | null => {
  const [editor] = use_lexical_composer_context();
  const [is_text, set_is_text] = React.useState(false);
  const link = use_atom_value(link_atom);

  /**
   * Updates the popover props
   */
  const update_popover = React.useCallback(() => {
    editor.getEditorState().read(() => {
      // Should not pop up the floating toolbar when using IME input
      if (editor.isComposing()) {
        return;
      }

      const selection = $get_selection();
      const native_selection = window.getSelection();
      const root_element = editor.getRootElement();

      if (
        native_selection !== null &&
        (!$is_range_selection(selection) ||
          root_element === null ||
          !root_element.contains(native_selection.anchorNode))
      ) {
        set_is_text(false);
        return;
      }

      if (!$is_range_selection(selection)) {
        return;
      }

      const node = get_selected_node(selection);

      if (selection.getTextContent() !== "") {
        set_is_text($is_text_node(node));
      } else {
        set_is_text(false);
      }

      const raw_text_content = selection.getTextContent().replace(/\n/g, "");

      if (!selection.isCollapsed() && raw_text_content === "") {
        set_is_text(false);
      }
    });
  }, [editor]);

  React.useEffect(() => {
    document.addEventListener("selectionchange", update_popover);
    return () => {
      document.removeEventListener("selectionchange", update_popover);
    };
  }, [update_popover]);

  React.useEffect(
    () =>
      merge_register(
        editor.registerUpdateListener(update_popover),
        editor.registerRootListener(() => {
          if (editor.getRootElement() === null) {
            set_is_text(false);
          }
        })
      ),
    [editor, update_popover]
  );

  if (!is_text || link) {
    return null;
  }

  return create_portal(<FloatingTextStylePopover />, document.body);
};

export default FloatingTextStylePlugin;
