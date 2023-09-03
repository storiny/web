import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection";
import { mergeRegister } from "@lexical/utils";
import { AssetRating } from "@storiny/shared";
import { clsx } from "clsx";
import {
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  DRAGSTART_COMMAND,
  GridSelection,
  LexicalEditor,
  NodeKey,
  NodeSelection,
  RangeSelection,
  SELECTION_CHANGE_COMMAND
} from "lexical";
import React from "react";

import AspectRatio from "~/components/AspectRatio";
import Image from "~/components/Image";

import { Block } from "../block";
import { $isImageNode } from "./image";
import styles from "./image.module.scss";
import ImageResizer from "./resizer";

const ImageComponent = ({
  alt,
  nodeKey,
  imgKey,
  width,
  rating,
  height,
  resizable,
  scaleFactor
}: {
  alt: string;
  height: number;
  imgKey: string;
  nodeKey: NodeKey;
  rating: AssetRating;
  resizable: boolean;
  scaleFactor: number;
  width: number;
}): React.ReactElement => {
  const activeEditorRef = React.useRef<LexicalEditor | null>(null);
  const imageRef = React.useRef<HTMLImageElement | null>(null);
  const wrapperRef = React.useRef<HTMLDivElement | null>(null);
  const [isSelected, setSelected, clearSelection] =
    useLexicalNodeSelection(nodeKey);
  const [isResizing, setIsResizing] = React.useState<boolean>(false);
  const [editor] = useLexicalComposerContext();
  const [selection, setSelection] = React.useState<
    RangeSelection | NodeSelection | GridSelection | null
  >(null);

  React.useEffect(() => {
    let isMounted = true;

    const unregister = mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        if (isMounted) {
          setSelection(editorState.read($getSelection));
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
      )
    );

    return () => {
      isMounted = false;
      unregister();
    };
  }, [clearSelection, editor, isResizing, isSelected, nodeKey, setSelected]);

  const onResizeEnd = (nextScale: number): void => {
    // Delay hiding the resize bars for click case
    setTimeout(() => {
      setIsResizing(false);
    }, 200);

    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isImageNode(node)) {
        node.setScaleFactor(nextScale);
      }
    });
  };

  const onResizeStart = (): void => {
    setIsResizing(true);
  };

  const draggable = isSelected && $isNodeSelection(selection) && !isResizing;
  const isFocused = isSelected || isResizing;

  return (
    <Block className={styles["image-wrapper"]} nodeKey={nodeKey}>
      <div draggable={draggable}>
        <AspectRatio
          className={clsx(
            isFocused && $isNodeSelection(selection) && styles.draggable
          )}
          ratio={width / height}
          ref={wrapperRef}
          style={{
            maxWidth: "100%",
            width: `${width * scaleFactor}px`
          }}
        >
          <Image
            alt={alt}
            imgRef={imageRef}
            rating={rating}
            src={
              "https://images.unsplash.com/photo-1692983308144-4421ad60809b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
            }
          />
        </AspectRatio>
      </div>
      {resizable && $isNodeSelection(selection) && isFocused && (
        <ImageResizer
          editor={editor}
          onResizeEnd={onResizeEnd}
          onResizeStart={onResizeStart}
          scaleFactor={scaleFactor}
          width={width}
          wrapperRef={wrapperRef}
        />
      )}
    </Block>
  );
};

export default ImageComponent;
