import { useLexicalComposerContext as use_lexical_composer_context } from "@lexical/react/LexicalComposerContext";
import { clsx } from "clsx";
import { $getNodeByKey as $get_node_by_key } from "lexical";
import React from "react";

import Divider from "~/components/divider";
import IconButton from "~/components/icon-button";
import Gallery from "~/entities/gallery";
import MasonryAddIcon from "~/icons/masonry-add";
import RotateIcon from "~/icons/rotate";

import { $is_image_node, ImageItem, MAX_IMAGE_ITEMS } from "../../image";
import styles from "../image.module.scss";
import ImageAltEditor from "./alt-editor";
import ImageLayoutToggleGroup from "./layout-toggle-group";
import { ImageNodeControlsProps } from "./node-controls.props";

const ImageNodeControls = (
  props: ImageNodeControlsProps
): React.ReactElement => {
  const { node_key, images, layout } = props;
  const [editor] = use_lexical_composer_context();

  /**
   * Adds a new image item
   */
  const add_image_item = React.useCallback(
    (next_item: ImageItem) => {
      editor.update(() => {
        const node = $get_node_by_key(node_key);
        if ($is_image_node(node)) {
          node.add_image_item(next_item);
        }
      });
    },
    [editor, node_key]
  );

  /**
   * Changes the positions of image items
   */
  const change_item_positions = React.useCallback(() => {
    editor.update(() => {
      const node = $get_node_by_key(node_key);
      if ($is_image_node(node)) {
        node.change_item_positions();
      }
    });
  }, [editor, node_key]);

  return (
    <React.Fragment>
      <ImageLayoutToggleGroup
        fit_disabled={images.length > 1}
        layout={layout}
        node_key={node_key}
      />
      <Divider />
      <div className={"flex-center"}>
        <Gallery
          on_confirm={(next_item): void => {
            add_image_item({
              alt: next_item.alt,
              height: next_item.height,
              width: next_item.width,
              rating: next_item.rating,
              scale_factor: 1,
              hex: next_item.hex,
              key: next_item.key
            });
          }}
        >
          <IconButton
            aria-label={"Add more images"}
            className={clsx("focus-invert", styles.x, styles.button)}
            disabled={images.length >= MAX_IMAGE_ITEMS}
            title={"Add more images"}
            variant={"ghost"}
          >
            <MasonryAddIcon />
          </IconButton>
        </Gallery>
        <Divider orientation={"vertical"} />
        <IconButton
          aria-label={"Change image positions"}
          className={clsx("focus-invert", styles.x, styles.button)}
          disabled={images.length === 1}
          onClick={change_item_positions}
          title={"Change image positions"}
          variant={"ghost"}
        >
          <RotateIcon />
        </IconButton>
        <Divider orientation={"vertical"} />
        <ImageAltEditor
          disabled={images.length !== 1}
          image={images[0]}
          node_key={node_key}
        />
      </div>
    </React.Fragment>
  );
};

export default ImageNodeControls;
