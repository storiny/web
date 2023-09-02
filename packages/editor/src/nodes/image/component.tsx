import { LinkNode } from "@lexical/link";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection";
import { mergeRegister } from "@lexical/utils";
import { clsx } from "clsx";
import {
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  $setSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  DRAGSTART_COMMAND,
  GridSelection,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND,
  LexicalEditor,
  NodeKey,
  NodeSelection,
  RangeSelection,
  SELECTION_CHANGE_COMMAND
} from "lexical";
import React from "react";

import AspectRatio from "~/components/AspectRatio";
import Image from "~/components/Image";

import NestedComposer from "../../composer/nested";
import { EditorNamespace } from "../../constants";
import AutoFocusPlugin from "../../plugins/auto-focus";
import CollaborationPlugin from "../../plugins/collaboration";
import ColorPlugin from "../../plugins/color/color";
import LinkPlugin from "../../plugins/link";
import RichTextPlugin from "../../plugins/rich-text";
import { createWebsocketProvider } from "../../utils/create-ws-provider";
import { ColorNode } from "../color";
import ImageContentEditable from "./content-editable";
import { $isImageNode } from "./image";
import ImagePlaceholder from "./placeholder";
import ImageResizer from "./resizer";

const ImageComponent = ({
  alt,
  nodeKey,
  imgKey,
  width,
  height,
  resizable,
  scaleFactor,
  caption
}: {
  alt: string;
  caption: LexicalEditor;
  height: number;
  imgKey: string;
  nodeKey: NodeKey;
  resizable: boolean;
  scaleFactor: number;
  width: number;
}): React.ReactElement => {
  const imageRef = React.useRef<null | HTMLImageElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement | null>(null);
  const [isSelected, setSelected, clearSelection] =
    useLexicalNodeSelection(nodeKey);
  const [isResizing, setIsResizing] = React.useState<boolean>(false);
  const [editor] = useLexicalComposerContext();
  const [selection, setSelection] = React.useState<
    RangeSelection | NodeSelection | GridSelection | null
  >(null);
  const activeEditorRef = React.useRef<LexicalEditor | null>(null);

  const onDelete = React.useCallback(
    (payload: KeyboardEvent) => {
      if (isSelected && $isNodeSelection($getSelection())) {
        payload.preventDefault();
        const node = $getNodeByKey(nodeKey);

        if ($isImageNode(node)) {
          node.remove();
        }
      }
      return false;
    },
    [isSelected, nodeKey]
  );

  const onEnter = React.useCallback(
    (event: KeyboardEvent) => {
      const latestSelection = $getSelection();

      if (
        isSelected &&
        $isNodeSelection(latestSelection) &&
        latestSelection.getNodes().length === 1
      ) {
        // Move focus into nested editor
        $setSelection(null);
        event.preventDefault();
        caption.focus();

        return true;
      }

      return false;
    },
    [caption, isSelected]
  );

  const onEscape = React.useCallback(
    (event: KeyboardEvent) => {
      if (
        activeEditorRef.current === caption ||
        buttonRef.current === event.target
      ) {
        $setSelection(null);
        editor.update(() => {
          setSelected(true);
          const parentRootElement = editor.getRootElement();
          if (parentRootElement !== null) {
            parentRootElement.focus();
          }
        });
        return true;
      }
      return false;
    },
    [caption, editor, setSelected]
  );

  React.useEffect(() => {
    let isMounted = true;
    const unregister = mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        if (isMounted) {
          setSelection(editorState.read(() => $getSelection()));
        }
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        (_, activeEditor) => {
          activeEditorRef.current = activeEditor;
          return false;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand<MouseEvent>(
        CLICK_COMMAND,
        (payload) => {
          const event = payload;

          if (isResizing) {
            return true;
          }
          if (event.target === imageRef.current) {
            if (event.shiftKey) {
              setSelected(!isSelected);
            } else {
              clearSelection();
              setSelected(true);
            }
            return true;
          }

          return false;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        DRAGSTART_COMMAND,
        (event) => {
          if (event.target === imageRef.current) {
            // TODO This is just a temporary workaround for FF to behave like other browsers.
            // Ideally, this handles drag & drop too (and all browsers).
            event.preventDefault();
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        KEY_DELETE_COMMAND,
        onDelete,
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        onDelete,
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(KEY_ENTER_COMMAND, onEnter, COMMAND_PRIORITY_LOW),
      editor.registerCommand(KEY_ESCAPE_COMMAND, onEscape, COMMAND_PRIORITY_LOW)
    );
    return () => {
      isMounted = false;
      unregister();
    };
  }, [
    clearSelection,
    editor,
    isResizing,
    isSelected,
    nodeKey,
    onDelete,
    onEnter,
    onEscape,
    setSelected
  ]);

  const onResizeEnd = (
    nextWidth: "inherit" | number,
    nextHeight: "inherit" | number
  ): void => {
    // Delay hiding the resize bars for click case
    setTimeout(() => {
      setIsResizing(false);
    }, 200);

    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isImageNode(node)) {
        // node.setWidthAndHeight(nextWidth, nextHeight);
      }
    });
  };

  const onResizeStart = (): void => {
    setIsResizing(true);
  };
  const draggable = isSelected && $isNodeSelection(selection) && !isResizing;
  const isFocused = isSelected || isResizing;
  return (
    <>
      <div draggable={draggable}>
        <AspectRatio ratio={height / width}>
          <Image
            alt={alt}
            className={clsx(
              isFocused &&
                `focused ${$isNodeSelection(selection) ? "draggable" : ""}`
            )}
            height={height}
            ref={imageRef}
            // TODO: Change SRC
            src={
              "https://images.unsplash.com/photo-1692983308144-4421ad60809b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
            }
            width={width}
          />
        </AspectRatio>
      </div>
      <div className="image-caption-container">
        {/*<NestedComposer*/}
        {/*  initialEditor={caption}*/}
        {/*  initialNodes={[LinkNode, ColorNode]}*/}
        {/*  namespace={EditorNamespace.IMAGE_CAPTION}*/}
        {/*  skipCollabChecks={true}*/}
        {/*>*/}
        {/*  <AutoFocusPlugin />*/}
        {/*  <LinkPlugin />*/}
        {/*  <ColorPlugin />*/}
        {/*  <CollaborationPlugin*/}
        {/*    id={caption.getKey()}*/}
        {/*    providerFactory={createWebsocketProvider}*/}
        {/*    shouldBootstrap={true}*/}
        {/*  />*/}
        {/*  <RichTextPlugin*/}
        {/*    ErrorBoundary={LexicalErrorBoundary}*/}
        {/*    contentEditable={<ImageContentEditable />}*/}
        {/*    placeholder={<ImagePlaceholder />}*/}
        {/*  />*/}
        {/*</NestedComposer>*/}
      </div>
      {resizable && $isNodeSelection(selection) && isFocused && (
        <ImageResizer
          editor={editor}
          imageRef={imageRef}
          onResizeEnd={onResizeEnd}
          onResizeStart={onResizeStart}
        />
      )}
    </>
  );
};

export default ImageComponent;
