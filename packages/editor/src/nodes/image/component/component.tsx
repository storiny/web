"use client";

import { useLexicalComposerContext as use_lexical_composer_context } from "@lexical/react/LexicalComposerContext";
import { useLexicalNodeSelection as use_lexical_node_selection } from "@lexical/react/useLexicalNodeSelection";
import { mergeRegister as merge_register } from "@lexical/utils";
import { ImageSize } from "@storiny/shared";
import { clsx } from "clsx";
import { useSetAtom as use_set_atom } from "jotai";
import {
  $getNodeByKey as $get_node_by_key,
  $getSelection as $get_selection,
  $isNodeSelection as $is_node_selection,
  BaseSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  DRAGSTART_COMMAND,
  NodeKey
} from "lexical";
import dynamic from "next/dynamic";
import React from "react";
import { useHotkeys as use_hot_keys } from "react-hotkeys-hook";
import { useIntersectionObserver as use_intersection_observer } from "react-intersection-observer-hook";
import use_resize_observer from "use-resize-observer";

import { use_blog_context } from "~/common/context/blog";
import AspectRatio from "~/components/aspect-ratio";
import IconButton from "~/components/icon-button";
import Image from "~/components/image";
import Popover from "~/components/popover";
import Spinner from "~/components/spinner";
import Zoom from "~/components/zoom";
import TrashIcon from "~/icons/trash";
import { BREAKPOINTS } from "~/theme/breakpoints";
import css from "~/theme/main.module.scss";
import { get_cdn_url } from "~/utils/get-cdn-url";

import { overflowing_figures_atom } from "../../../atoms";
import figure_styles from "../../common/figure.module.scss";
import { $is_image_node, ImageItem, ImageNodeLayout } from "../image";
import styles from "./image.module.scss";
import ImageResizer from "./resizer";

const ImageNodeControls = dynamic(() => import("./node-controls"), {
  loading: () => (
    <div className={css["flex-center"]} style={{ padding: "24px 48px" }}>
      <Spinner />
    </div>
  )
});

/**
 * Computes the responsive image `sizes` attribute based on the layout
 * @param layout Image layout
 * @param item_count Number of images present in the node
 * @param item_index Index of the current image
 */
const get_image_sizes = (
  layout: ImageNodeLayout,
  item_count: number,
  item_index: number
): string =>
  layout === "fit"
    ? "960px"
    : (layout === "screen-width"
        ? [
            item_count === 2
              ? "50vw" // Half of the screen
              : item_count === 3
                ? item_index === 0
                  ? "66.6vw" // 2/3 of the screen
                  : "33.3vw" // 1/3 of the screen
                : "100vw" // Full screen width
          ]
        : layout === "overflow"
          ? [
              `${BREAKPOINTS.up("desktop")} ${
                item_count === 2
                  ? "640px" // Half of the layout width
                  : item_count === 3
                    ? item_index === 0
                      ? "860px" // 2/3 of 1300px
                      : "432px" // 1/3 of 1300px
                    : "1300px" // Width of both the sidebars and the main content
              }`,
              "100vw"
            ]
          : [
              `${BREAKPOINTS.up("desktop")} 680px`, // Fill the main content
              "100vw" // Stretch over the entire screen
            ]
      ).join(",");

const ImageComponent = ({
  images,
  node_key,
  resizable,
  layout
}: {
  images: ImageItem[];
  layout: ImageNodeLayout;
  node_key: NodeKey;
  resizable: boolean;
}): React.ReactElement | null => {
  const items_container_ref = React.useRef<HTMLDivElement | null>(null);
  const blog = use_blog_context();
  const [editor] = use_lexical_composer_context();
  const [selected, set_selected, clear_selection] =
    use_lexical_node_selection(node_key);
  const [resizing, set_resizing] = React.useState<boolean>(false);
  const [selection, set_selection] = React.useState<BaseSelection | null>(null);
  const set_overflowing_figures = use_set_atom(overflowing_figures_atom);
  const { height: container_height, ref: container_ref } =
    use_resize_observer();
  const [ref, { entry }] = use_intersection_observer({
    rootMargin: "-52px 0px 0px 0px"
  });

  use_hot_keys(
    "backspace,delete",
    (event) => {
      if (selected && $is_node_selection(selection)) {
        event.preventDefault();
        set_selected(false);

        editor.update(() => {
          const node = $get_node_by_key(node_key);
          if ($is_image_node(node)) {
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
   * @param next_scale Scale after resizing
   */
  const on_resize_end = React.useCallback(
    (next_scale: number) => {
      // Delay hiding the resize bars for a click case
      setTimeout(() => {
        set_resizing(false);
      }, 200);

      editor.update(() => {
        const node = $get_node_by_key(node_key);
        if ($is_image_node(node)) {
          node.set_scale_factor(next_scale);
        }
      });
    },
    [editor, node_key]
  );

  /**
   * Resize start handler
   */
  const on_resize_start = React.useCallback(() => {
    set_resizing(true);
  }, []);

  /**
   * Removes the image item present at the specified index
   */
  const remove_item_at_index = React.useCallback(
    (index: number) => {
      editor.update(() => {
        const node = $get_node_by_key(node_key);
        if ($is_image_node(node)) {
          node.remove_image_item(index);
        }
      });
    },
    [editor, node_key]
  );

  React.useEffect(() => {
    let is_mounted = true;

    const unregister = merge_register(
      editor.registerUpdateListener(({ editorState: editor_state }) => {
        if (is_mounted) {
          set_selection(editor_state.read($get_selection));
        }
      }),
      editor.registerCommand<MouseEvent>(
        CLICK_COMMAND,
        (event) => {
          if (resizing) {
            return true;
          }

          if (
            items_container_ref.current?.contains(event.target as HTMLElement)
          ) {
            if (event.shiftKey) {
              set_selected(!selected);
            } else {
              clear_selection();
              set_selected(true);
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
            items_container_ref.current?.contains(event.target as HTMLElement)
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
      is_mounted = false;
      unregister();
    };
  }, [clear_selection, editor, resizing, selected, set_selected]);

  React.useEffect(() => {
    set_overflowing_figures((prev) => {
      if (visible && ["overflow", "screen-width"].includes(layout)) {
        prev.add(node_key);
      } else {
        prev.delete(node_key);
      }

      return new Set(prev);
    });

    return () => {
      set_overflowing_figures((prev) => {
        prev.delete(node_key);
        return new Set(prev);
      });
    };
  }, [layout, node_key, set_overflowing_figures, visible]);

  return (
    <div className={styles.image} ref={ref}>
      <div
        className={clsx(
          styles.container,
          editable && styles.editable,
          focused && styles.focused,
          // Grid for overflowing the image
          layout !== "fit" && [css["grid"], css["dashboard"], css["no-sidenav"]]
        )}
        data-layout={layout}
        ref={container_ref}
      >
        {["overflow", "screen-width"].includes(layout) &&
        !blog?.is_story_minimal_layout ? (
          <span
            aria-hidden
            className={figure_styles["left-banner"]}
            data-layout={layout}
            data-visible={String(visible)}
          />
        ) : null}
        <Popover
          className={clsx(
            css["flex-center"],
            css["flex-col"],
            styles.x,
            styles.popover
          )}
          onOpenChange={(next_open: boolean): void => {
            if (!next_open && !resizing) {
              set_selected(false);
            }
          }}
          open={
            editable && focused && !resizing && $is_node_selection(selection)
          }
          slot_props={{
            content: {
              // eslint-disable-next-line prefer-snakecase/prefer-snakecase
              collisionPadding: { top: 64 }, // Prevent header collision
              // eslint-disable-next-line prefer-snakecase/prefer-snakecase
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
              ref={items_container_ref}
              role={"button"}
              style={{
                width:
                  layout === "fit" && images.length === 1
                    ? `${images[0].width * images[0].scale_factor}px`
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
                    img_key={image.key}
                    rating={editable ? undefined : image.rating}
                    render_image={(img): React.ReactElement =>
                      editable ||
                      (images.length === 1 && layout === "screen-width") ? (
                        img
                      ) : (
                        <Zoom zoom_margin={32}>{img}</Zoom>
                      )
                    }
                    slot_props={{
                      image: {
                        loading: "lazy",
                        sizes: get_image_sizes(layout, images.length, index),
                        // eslint-disable-next-line prefer-snakecase/prefer-snakecase
                        srcSet: [
                          `${get_cdn_url(image.key, ImageSize.W_2440)} 2440w`,
                          `${get_cdn_url(image.key, ImageSize.W_1920)} 1920w`,
                          `${get_cdn_url(image.key, ImageSize.W_1440)} 1440w`,
                          `${get_cdn_url(image.key, ImageSize.W_1200)} 1200w`,
                          `${get_cdn_url(image.key, ImageSize.W_960)} 960w`,
                          `${get_cdn_url(image.key, ImageSize.W_640)} 640w`,
                          `${get_cdn_url(image.key, ImageSize.W_320)} 320w`
                        ].join(","),
                        // @ts-expect-error Data width attribute
                        "data-width": image.width,
                        "data-height": image.height
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
                      onClick={(): void => remove_item_at_index(index)}
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
            node_key={node_key}
          />
        </Popover>
        {["overflow", "screen-width"].includes(layout) &&
        !blog?.is_story_minimal_layout ? (
          <span
            aria-hidden
            className={figure_styles["right-banner"]}
            data-layout={layout}
            data-visible={String(visible)}
          />
        ) : null}
        {editable &&
        images.length === 1 &&
        resizable &&
        focused &&
        $is_node_selection(selection) ? (
          <ImageResizer
            editor={editor}
            items_container_ref={items_container_ref}
            on_resize_end={on_resize_end}
            on_resize_start={on_resize_start}
            scale_factor={images[0].scale_factor}
            width={images[0].width}
          />
        ) : null}
      </div>
      {layout !== "fit" && (
        // Compensate for the absolute position of the image element
        <div
          aria-hidden
          style={{
            height: container_height
          }}
        />
      )}
    </div>
  );
};

export default ImageComponent;
