"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import { getShortcutLabel } from "@storiny/shared/src/utils/get-shortcut-label";
import { clsx } from "clsx";
import { useAtomValue } from "jotai";
import {
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_LOW,
  SELECTION_CHANGE_COMMAND
} from "lexical";
import React from "react";
import { createPortal } from "react-dom";

import ToggleGroup from "~/components/ToggleGroup";
import ToggleGroupItem from "~/components/ToggleGroupItem";
import BoldIcon from "~/icons/Bold";
import ItalicIcon from "~/icons/Italic";
import LinkIcon from "~/icons/Link";
import UnderlineIcon from "~/icons/Underline";

import { linkAtom } from "../../atoms";
import { EDITOR_SHORTCUTS } from "../../constants/shortcuts";
import { useBold } from "../../hooks/use-bold";
import { useItalic } from "../../hooks/use-italic";
import { useLink } from "../../hooks/use-link";
import { useUnderline } from "../../hooks/use-underline";
import { getSelectedNode } from "../../utils/get-selected-node";
import { setFloatingElementPosition } from "../../utils/set-floating-element-position";
import floatingElementStyles from "../common/floating-element.module.scss";
import FloatingElementArrow from "../common/floating-element-arrow";
import styles from "./floating-text-style.module.scss";

const FloatingTextStylePopover = (): React.ReactElement => {
  const popoverRef = React.useRef<HTMLDivElement | null>(null);
  const [editor] = useLexicalComposerContext();
  const [bold, toggleBold] = useBold();
  const [italic, toggleItalic] = useItalic();
  const [underline, toggleUnderline] = useUnderline();
  const [link, insertLink] = useLink();

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
  const mouseMoveListener = (event: MouseEvent): void => {
    if (popoverRef?.current && (event.buttons === 1 || event.buttons === 3)) {
      if (popoverRef.current.style.pointerEvents !== "none") {
        const x = event.clientX;
        const y = event.clientY;
        const elementUnderMouse = document.elementFromPoint(x, y);

        if (!popoverRef.current.contains(elementUnderMouse)) {
          // Mouse is not over the target element -> not a normal click, but probably a drag
          popoverRef.current.style.pointerEvents = "none";
        }
      }
    }
  };

  /**
   * Mouse up listener
   */
  const mouseUpListener = (): void => {
    if (
      popoverRef?.current &&
      popoverRef.current.style.pointerEvents !== "auto"
    ) {
      popoverRef.current.style.pointerEvents = "auto";
    }
  };

  /**
   * Updates the popover position
   */
  const updatePopover = React.useCallback(() => {
    const selection = $getSelection();
    const popoverElement = popoverRef.current;
    const nativeSelection = window.getSelection();

    if (popoverElement === null) {
      return;
    }

    const rootElement = editor.getRootElement();

    if (
      selection !== null &&
      nativeSelection !== null &&
      !nativeSelection.isCollapsed &&
      rootElement !== null &&
      rootElement.contains(nativeSelection.anchorNode)
    ) {
      setFloatingElementPosition(popoverElement, rootElement);
    }
  }, [editor]);

  React.useEffect(() => {
    if (popoverRef?.current) {
      document.addEventListener("mousemove", mouseMoveListener);
      document.addEventListener("mouseup", mouseUpListener);

      return () => {
        document.removeEventListener("mousemove", mouseMoveListener);
        document.removeEventListener("mouseup", mouseUpListener);
      };
    }
  }, [popoverRef]);

  React.useEffect(() => {
    const update = (): void => {
      editor.getEditorState().read(updatePopover);
    };

    window.addEventListener("resize", update);
    document.body.addEventListener("scroll", update);

    return () => {
      window.removeEventListener("resize", update);
      document.body.removeEventListener("scroll", update);
    };
  }, [editor, updatePopover]);

  React.useEffect(() => {
    editor.getEditorState().read(updatePopover);

    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(updatePopover);
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updatePopover();
          return false;
        },
        COMMAND_PRIORITY_LOW
      )
    );
  }, [editor, updatePopover]);

  return (
    <ToggleGroup
      className={clsx(
        "flex-center",
        floatingElementStyles.x,
        floatingElementStyles["floating-element"]
      )}
      ref={popoverRef}
      type={"multiple"}
      value={value}
    >
      <ToggleGroupItem
        className={clsx(styles.x, styles.toggle)}
        onClick={toggleBold}
        slotProps={{
          tooltip: {
            rightSlot: getShortcutLabel(EDITOR_SHORTCUTS.bold)
          }
        }}
        tooltipContent={"Bold"}
        value={"bold"}
      >
        <BoldIcon />
      </ToggleGroupItem>
      <ToggleGroupItem
        className={clsx(styles.x, styles.toggle)}
        onClick={toggleItalic}
        slotProps={{
          tooltip: {
            rightSlot: getShortcutLabel(EDITOR_SHORTCUTS.italic)
          }
        }}
        tooltipContent={"Italic"}
        value={"italic"}
      >
        <ItalicIcon />
      </ToggleGroupItem>
      <ToggleGroupItem
        className={clsx(styles.x, styles.toggle)}
        onClick={toggleUnderline}
        slotProps={{
          tooltip: {
            rightSlot: getShortcutLabel(EDITOR_SHORTCUTS.underline)
          }
        }}
        tooltipContent={"Underline"}
        value={"underline"}
      >
        <UnderlineIcon />
      </ToggleGroupItem>
      <ToggleGroupItem
        className={clsx(styles.x, styles.toggle)}
        onClick={(): void => insertLink()}
        slotProps={{
          tooltip: {
            rightSlot: getShortcutLabel(EDITOR_SHORTCUTS.link)
          }
        }}
        tooltipContent={"Link"}
        value={"link"}
      >
        <LinkIcon />
      </ToggleGroupItem>
      <FloatingElementArrow />
    </ToggleGroup>
  );
};

const FloatingTextStylePlugin = (): React.ReactElement | null => {
  const [editor] = useLexicalComposerContext();
  const [isText, setIsText] = React.useState(false);
  const link = useAtomValue(linkAtom);

  /**
   * Updates the popover props
   */
  const updatePopover = React.useCallback(() => {
    editor.getEditorState().read(() => {
      // Should not pop up the floating toolbar when using IME input
      if (editor.isComposing()) {
        return;
      }

      const selection = $getSelection();
      const nativeSelection = window.getSelection();
      const rootElement = editor.getRootElement();

      if (
        nativeSelection !== null &&
        (!$isRangeSelection(selection) ||
          rootElement === null ||
          !rootElement.contains(nativeSelection.anchorNode))
      ) {
        setIsText(false);
        return;
      }

      if (!$isRangeSelection(selection)) {
        return;
      }

      const node = getSelectedNode(selection);

      if (selection.getTextContent() !== "") {
        setIsText($isTextNode(node));
      } else {
        setIsText(false);
      }

      const rawTextContent = selection.getTextContent().replace(/\n/g, "");

      if (!selection.isCollapsed() && rawTextContent === "") {
        setIsText(false);
      }
    });
  }, [editor]);

  React.useEffect(() => {
    document.addEventListener("selectionchange", updatePopover);
    return () => {
      document.removeEventListener("selectionchange", updatePopover);
    };
  }, [updatePopover]);

  React.useEffect(
    () =>
      mergeRegister(
        editor.registerUpdateListener(updatePopover),
        editor.registerRootListener(() => {
          if (editor.getRootElement() === null) {
            setIsText(false);
          }
        })
      ),
    [editor, updatePopover]
  );

  if (!isText || link) {
    return null;
  }

  return createPortal(<FloatingTextStylePopover />, document.body);
};

export default FloatingTextStylePlugin;
