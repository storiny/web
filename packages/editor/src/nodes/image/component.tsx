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
  NodeKey,
  NodeSelection,
  RangeSelection
} from "lexical";
import React from "react";
import { useHotkeys } from "react-hotkeys-hook";
import useResizeObserver from "use-resize-observer";

import AspectRatio from "~/components/AspectRatio";
import Image from "~/components/Image";
import Popover from "~/components/Popover";
import ToggleGroup from "~/components/ToggleGroup";
import ToggleGroupItem from "~/components/ToggleGroupItem";
import FigureFillIcon from "~/icons/figure-fill";
import FigureFitIcon from "~/icons/figure-fit";
import FigureOverflowIcon from "~/icons/figure-overflow";

import { $isImageNode, ImageNodeLayout } from "./image";
import styles from "./image.module.scss";
import { useIntersectionObserver } from "./observer";
import ImageResizer from "./resizer";

const ImageComponent = ({
  alt,
  nodeKey,
  imgKey,
  width,
  rating,
  height,
  resizable,
  scaleFactor,
  layout
}: {
  alt: string;
  height: number;
  imgKey: string;
  layout: ImageNodeLayout;
  nodeKey: NodeKey;
  rating: AssetRating;
  resizable: boolean;
  scaleFactor: number;
  width: number;
}): React.ReactElement => {
  const imageRef = React.useRef<HTMLImageElement | null>(null);
  const wrapperRef = React.useRef<HTMLDivElement | null>(null);
  const nodeRef = React.useRef<HTMLDivElement | null>(null);
  const [editor] = useLexicalComposerContext();
  const [isSelected, setSelected, clearSelection] =
    useLexicalNodeSelection(nodeKey);
  const [isResizing, setIsResizing] = React.useState<boolean>(false);
  const [selection, setSelection] = React.useState<
    RangeSelection | NodeSelection | GridSelection | null
  >(null);
  useHotkeys(
    "backspace,delete",
    (event) => {
      if (isSelected && $isNodeSelection(selection)) {
        event.preventDefault();
        setSelected(false);

        editor.update(() => {
          const node = $getNodeByKey(nodeKey);
          if ($isImageNode(node)) {
            node.remove();
          }
        });
      }
    },
    { enableOnContentEditable: true }
  );
  const draggable = isSelected && $isNodeSelection(selection) && !isResizing;
  const isFocused = isSelected || isResizing;

  const { height: wrapperHeight } = useResizeObserver({ ref: nodeRef });
  useIntersectionObserver(nodeRef, nodeKey);

  /**
   * Resize end handler
   * @param nextScale Scale after resizing
   */
  const onResizeEnd = React.useCallback(
    (nextScale: number) => {
      // Delay hiding the resize bars for a click case
      setTimeout(() => {
        setIsResizing(false);
      }, 200);

      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if ($isImageNode(node)) {
          node.setScaleFactor(nextScale);
        }
      });
    },
    [editor, nodeKey]
  );

  /**
   * Resize start handler
   */
  const onResizeStart = React.useCallback(() => {
    setIsResizing(true);
  }, []);

  /**
   * Updates the node layout
   */
  const setLayout = React.useCallback(
    (nextLayout: ImageNodeLayout) => {
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if (
          $isImageNode(node) &&
          (["fit", "fill", "overflow"] as ImageNodeLayout[]).includes(
            nextLayout
          )
        ) {
          node.setLayout(nextLayout);
        }
      });
    },
    [editor, nodeKey]
  );

  React.useEffect(() => {
    let isMounted = true;

    const unregister = mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        if (isMounted) {
          setSelection(editorState.read($getSelection));
        }
      }),
      editor.registerCommand<MouseEvent>(
        CLICK_COMMAND,
        (event) => {
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
  }, [clearSelection, editor, isResizing, isSelected, setSelected]);

  return (
    <div
      className={clsx(
        styles["image-wrapper"],
        editor.isEditable() && styles.editable,
        isFocused && $isNodeSelection(selection) && styles.draggable,
        isFocused && styles.focused,
        layout === "fit" && styles.fit
      )}
    >
      <div
        className={clsx(
          layout !== "fit" && ["grid", "dashboard", "no-sidenav", styles.node]
        )}
        draggable={draggable}
        ref={nodeRef}
        tabIndex={-1}
      >
        <Popover
          className={clsx(styles.x, styles.popover)}
          onOpenChange={(newOpen): void => {
            if (!newOpen && !isResizing) {
              setSelected(false);
            }
          }}
          open={$isNodeSelection(selection) && isFocused && !isResizing}
          slotProps={{
            content: {
              collisionPadding: { top: 64 },
              sideOffset: 12,
              side: "top"
            }
          }}
          trigger={
            <AspectRatio
              className={styles["aspect-ratio"]}
              data-layout={layout}
              ratio={width / height}
              ref={wrapperRef}
              style={{
                width: layout === "fit" ? `${width * scaleFactor}px` : undefined
              }}
            >
              <Image
                alt={alt}
                imgRef={imageRef}
                rating={rating}
                src={
                  "https://images.unsplash.com/photo-1635776062127-d379bfcba9f8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1932&q=80"
                }
              />
            </AspectRatio>
          }
        >
          <ToggleGroup
            onValueChange={(value: ImageNodeLayout): void => setLayout(value)}
            value={layout}
          >
            <ToggleGroupItem
              className={clsx(styles.x, styles.toggle)}
              tooltipContent={"Fit"}
              value={"fit" as ImageNodeLayout}
            >
              <FigureFitIcon />
            </ToggleGroupItem>
            <ToggleGroupItem
              className={clsx(styles.x, styles.toggle)}
              tooltipContent={"Fill"}
              value={"fill" as ImageNodeLayout}
            >
              <FigureFillIcon />
            </ToggleGroupItem>
            <ToggleGroupItem
              className={clsx(styles.x, styles.toggle)}
              tooltipContent={"Overflow"}
              value={"overflow" as ImageNodeLayout}
            >
              <FigureOverflowIcon />
            </ToggleGroupItem>
          </ToggleGroup>
        </Popover>
      </div>
      {layout !== "fit" && (
        <div
          aria-hidden
          style={{
            display: "block",
            height: wrapperHeight
          }}
        />
      )}
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
    </div>
  );
};

export default ImageComponent;
