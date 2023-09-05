import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { clsx } from "clsx";
import { $getNodeByKey } from "lexical";
import React from "react";

import Divider from "~/components/Divider";
import IconButton from "~/components/IconButton";
import Gallery from "~/entities/gallery";
import MasonryAddIcon from "~/icons/masonry-add";
import RotateIcon from "~/icons/rotate";

import { $isImageNode, ImageItem, MAX_IMAGE_ITEMS } from "../../image";
import styles from "../image.module.scss";
import ImageAltEditor from "./alt-editor";
import ImageLayoutToggleGroup from "./layout-toggle-group";
import { ImageNodeControlsProps } from "./node-controls.props";

const ImageNodeControls = (
  props: ImageNodeControlsProps
): React.ReactElement => {
  const { nodeKey, images, layout } = props;
  const [editor] = useLexicalComposerContext();

  /**
   * Adds a new image item
   */
  const addImageItem = React.useCallback(
    (newItem: ImageItem) => {
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if ($isImageNode(node)) {
          node.addImageItem(newItem);
        }
      });
    },
    [editor, nodeKey]
  );

  /**
   * Changes the positions of image items
   */
  const changeItemPositions = React.useCallback(() => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isImageNode(node)) {
        node.changeItemPositions();
      }
    });
  }, [editor, nodeKey]);

  return (
    <React.Fragment>
      <ImageLayoutToggleGroup
        fitDisabled={images.length > 1}
        layout={layout}
        nodeKey={nodeKey}
      />
      <Divider />
      <div className={"flex-center"}>
        <Gallery
          onConfirm={(newItem): void => {
            addImageItem({
              alt: newItem.alt,
              height: newItem.height,
              width: newItem.width,
              rating: newItem.rating,
              scaleFactor: 1,
              hex: newItem.hex,
              key: newItem.key
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
          onClick={changeItemPositions}
          title={"Change image positions"}
          variant={"ghost"}
        >
          <RotateIcon />
        </IconButton>
        <Divider orientation={"vertical"} />
        <ImageAltEditor
          disabled={images.length !== 1}
          image={images[0]}
          nodeKey={nodeKey}
        />
      </div>
    </React.Fragment>
  );
};

export default ImageNodeControls;
