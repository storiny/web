import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection";
import { mergeRegister } from "@lexical/utils";
import { ImageSize } from "@storiny/shared";
import { clsx } from "clsx";
import { useSetAtom } from "jotai";
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
import dynamic from "next/dynamic";
import React from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useIntersectionObserver } from "react-intersection-observer-hook";
import useResizeObserver from "use-resize-observer";

import AspectRatio from "~/components/AspectRatio";
import IconButton from "~/components/IconButton";
import Image from "~/components/Image";
import Popover from "~/components/Popover";
import Spinner from "~/components/Spinner";
import TrashIcon from "~/icons/Trash";
import { breakpoints } from "~/theme/breakpoints";
import { getCdnUrl } from "~/utils/getCdnUrl";

import { overflowingFiguresAtom } from "../../../atoms";
import figureStyles from "../../common/figure.module.scss";
import { $isImageNode, ImageItem, ImageNodeLayout } from "../image";
import styles from "./image.module.scss";
import ImageResizer from "./resizer";

const ImageNodeControls = dynamic(() => import("./node-controls"), {
  loading: () => (
    <div className={"flex-center"} style={{ padding: "24px 48px" }}>
      <Spinner />
    </div>
  )
});

/**
 * Computes the responsive image `sizes` attribute based on the layout
 * @param layout Image layout
 * @param itemCount Number of images present in the node
 * @param itemIndex Index of the current image
 */
const getImageSizes = (
  layout: ImageNodeLayout,
  itemCount: number,
  itemIndex: number
): string | undefined =>
  layout === "fit"
    ? undefined // Let the browser decide the size for `fit` images
    : (layout === "screen-width"
        ? [
            itemCount === 2
              ? "50%" // Half of the screen
              : itemCount === 3
              ? itemIndex === 0
                ? "66.6%" // 2/3 of the screen
                : "33.3%" // 1/3 of the screen
              : "100vw" // Full screen width
          ]
        : layout === "overflow"
        ? [
            `${breakpoints.up("desktop")} ${
              itemCount === 2
                ? "650px" // Half of the layout width
                : itemCount === 3
                ? itemIndex === 0
                  ? "860px" // 2/3 of 1300px
                  : "432px" // 1/3 of 1300px
                : "1300px" // Width of both the sidebars and the main content
            }`,
            "100vw"
          ]
        : [
            `${breakpoints.up("desktop")} 680px`, // Fill the main content
            "100vw" // Stretch over the entire screen
          ]
      ).join(",");

const ImageComponent = ({
  images,
  nodeKey,
  resizable,
  layout
}: {
  images: ImageItem[];
  layout: ImageNodeLayout;
  nodeKey: NodeKey;
  resizable: boolean;
}): React.ReactElement | null => {
  const itemsContainerRef = React.useRef<HTMLDivElement | null>(null);
  const [editor] = useLexicalComposerContext();
  const [selected, setSelected, clearSelection] =
    useLexicalNodeSelection(nodeKey);
  const [resizing, setResizing] = React.useState<boolean>(false);
  const [selection, setSelection] = React.useState<
    RangeSelection | NodeSelection | GridSelection | null
  >(null);
  const setOverflowingFigures = useSetAtom(overflowingFiguresAtom);
  const { height: containerHeight, ref: containerRef } = useResizeObserver();
  const [ref, { entry }] = useIntersectionObserver({
    rootMargin: "-52px 0px 0px 0px"
  });
  useHotkeys(
    "backspace,delete",
    (event) => {
      if (selected && $isNodeSelection(selection)) {
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
  const editable = editor.isEditable();
  const focused = selected || resizing;
  const visible = Boolean(entry && entry.isIntersecting);

  /**
   * Resize end handler
   * @param nextScale Scale after resizing
   */
  const onResizeEnd = React.useCallback(
    (nextScale: number) => {
      // Delay hiding the resize bars for a click case
      setTimeout(() => {
        setResizing(false);
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
    setResizing(true);
  }, []);

  /**
   * Removes the image item present at the specified index
   */
  const removeItemAtIndex = React.useCallback(
    (index: number) => {
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if ($isImageNode(node)) {
          node.removeImageItem(index);
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
          if (resizing) {
            return true;
          }

          if (
            itemsContainerRef.current?.contains(event.target as HTMLElement)
          ) {
            if (event.shiftKey) {
              setSelected(!selected);
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
          if (
            itemsContainerRef.current?.contains(event.target as HTMLElement)
          ) {
            event.preventDefault(); // Prevent dragging
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
  }, [clearSelection, editor, resizing, selected, setSelected]);

  React.useEffect(() => {
    setOverflowingFigures((prev) => {
      if (visible && ["overflow", "screen-width"].includes(layout)) {
        prev.add(nodeKey);
      } else {
        prev.delete(nodeKey);
      }

      return new Set(prev);
    });

    return () => {
      setOverflowingFigures((prev) => {
        prev.delete(nodeKey);
        return new Set(prev);
      });
    };
  }, [layout, nodeKey, setOverflowingFigures, visible]);

  return (
    <div className={styles.image} ref={ref}>
      <div
        className={clsx(
          styles.container,
          editable && styles.editable,
          focused && styles.focused,
          // Grid for overflowing the image
          layout !== "fit" && ["grid", "dashboard", "no-sidenav"]
        )}
        data-layout={layout}
        ref={containerRef}
      >
        {["overflow", "screen-width"].includes(layout) && (
          <span
            aria-hidden
            className={figureStyles["left-banner"]}
            data-layout={layout}
            data-visible={String(visible)}
          />
        )}
        <Popover
          className={clsx("flex-center", "flex-col", styles.x, styles.popover)}
          onOpenChange={(newOpen): void => {
            if (!newOpen && !resizing) {
              setSelected(false);
            }
          }}
          open={editable && focused && !resizing && $isNodeSelection(selection)}
          slotProps={{
            content: {
              collisionPadding: { top: 64 }, // Prevent header collision
              sideOffset: 12,
              side: "top"
            }
          }}
          trigger={
            <div
              className={styles["items-container"]}
              data-item-container={""}
              data-item-count={String(images.length)}
              data-layout={layout}
              data-testid={"image-node"}
              ref={itemsContainerRef}
              role={"button"}
              style={{
                width:
                  layout === "fit" && images.length === 1
                    ? `${images[0].width * images[0].scaleFactor}px`
                    : undefined
              }}
            >
              {images.map((image, index) => (
                <AspectRatio
                  className={clsx(styles.x, styles.item)}
                  data-index={String(index)}
                  key={index} // Use index as the key since duplicate image items could be present
                  ratio={image.width / image.height}
                >
                  <Image
                    alt={image.alt}
                    hex={image.hex}
                    imgId={image.key}
                    rating={editable ? undefined : image.rating}
                    slotProps={{
                      image: {
                        sizes: getImageSizes(layout, images.length, index),
                        srcSet: [
                          `${getCdnUrl(image.key, ImageSize.W_2048)} 2048w`,
                          `${getCdnUrl(image.key, ImageSize.W_1920)} 1920w`,
                          `${getCdnUrl(image.key, ImageSize.W_1440)} 1440w`,
                          `${getCdnUrl(image.key, ImageSize.W_1024)} 1024w`,
                          `${getCdnUrl(image.key, ImageSize.W_860)} 860w`,
                          `${getCdnUrl(image.key, ImageSize.W_640)} 640w`,
                          `${getCdnUrl(image.key, ImageSize.W_320)} 320w`
                        ].join(",")
                      }
                    }}
                  />
                  {editable && (
                    <IconButton
                      aria-label={"Remove image"}
                      className={clsx(
                        "force-light-mode",
                        styles.x,
                        styles["remove-button"]
                      )}
                      onClick={(): void => removeItemAtIndex(index)}
                      size={"sm"}
                      title={"Remove image"}
                    >
                      <TrashIcon />
                    </IconButton>
                  )}
                </AspectRatio>
              ))}
            </div>
          }
        >
          <ImageNodeControls
            images={images}
            layout={layout}
            nodeKey={nodeKey}
          />
        </Popover>
        {["overflow", "screen-width"].includes(layout) && (
          <span
            aria-hidden
            className={figureStyles["right-banner"]}
            data-layout={layout}
            data-visible={String(visible)}
          />
        )}
        {images.length === 1 &&
        resizable &&
        focused &&
        $isNodeSelection(selection) ? (
          <ImageResizer
            editor={editor}
            itemsContainerRef={itemsContainerRef}
            onResizeEnd={onResizeEnd}
            onResizeStart={onResizeStart}
            scaleFactor={images[0].scaleFactor}
            width={images[0].width}
          />
        ) : null}
      </div>
      {layout !== "fit" && (
        // Compensate for the absolute position of the image element
        <div
          aria-hidden
          style={{
            height: containerHeight
          }}
        />
      )}
    </div>
  );
};

export default ImageComponent;
