import { AssetRating } from "@storiny/shared";
import { LexicalNode, NodeKey, Spread } from "lexical";
import React from "react";

import { clamp } from "~/utils/clamp";

import { BlockNode, SerializedBlockNode } from "../block";
import ImageComponent from "./component";

export type ImageNodeLayout = "fit" | "fill" | "overflow" | "screen-width";

export interface ImageItem {
  alt: string;
  height: number;
  hex: string;
  key: string;
  rating: AssetRating;
  scale_factor: number;
  width: number;
}

export interface ImagePayload {
  images: Array<
    Omit<ImageItem, "scaleFactor"> & Partial<Pick<ImageItem, "scale_factor">>
  >;
  key?: NodeKey;
  layout?: ImageNodeLayout;
}

export type SerializedImageNode = Spread<
  {
    images: ImageItem[];
    layout: ImageNodeLayout;
  },
  SerializedBlockNode
>;

const TYPE = "image";
const VERSION = 1;

export const MIN_SCALE_FACTOR = 0.15;
export const MAX_SCALE_FACTOR = 1.5;
export const MAX_IMAGE_ITEMS = 3;

// noinspection TypeScriptFieldCanBeMadeReadonly
export class ImageNode extends BlockNode {
  /**
   * Ctor
   * @param images Image items
   * @param layout Image layout
   * @param key Node key
   */
  constructor(
    { images = [], layout }: Omit<ImagePayload, "key"> = {} as any,
    key?: NodeKey
  ) {
    super(key);
    this.__layout = layout || "fit";
    this.__images = [
      ...images.map((image) => ({
        ...image,
        scale_factor: image.scale_factor || 1
      }))
    ];
  }

  /**
   * Returns the type of the node
   */
  static override getType(): string {
    return TYPE;
  }

  /**
   * Clones the node
   * @param node Node
   */
  static override clone(node: ImageNode): ImageNode {
    return new ImageNode(
      {
        images: [...node.__images],
        layout: node.__layout
      },
      node.__key
    );
  }

  /**
   * Imports a serialized node
   * @param serialized_node Serialized node
   */
  static override importJSON(serialized_node: SerializedImageNode): ImageNode {
    return $create_image_node({
      images: [...serialized_node.images],
      layout: serialized_node.layout
    });
  }

  /**
   * Image items
   * @private
   */
  private readonly __images: ImageItem[];
  /**
   * Image layout
   * @private
   */
  private __layout: ImageNodeLayout;

  /**
   * Serializes the node to JSON
   */
  override exportJSON(): SerializedImageNode {
    return {
      ...super.exportJSON(),
      images: this.__images,
      layout: this.__layout,
      type: TYPE,
      version: VERSION
    };
  }

  /**
   * Returns the layout of the node
   */
  public get_layout(): ImageNodeLayout {
    return this.__layout;
  }

  /**
   * Adds a new image item
   * @param image_item Image item
   */
  public add_image_item(image_item: ImageItem): void {
    if (this.__images.length < MAX_IMAGE_ITEMS) {
      const writable = this.getWritable();
      writable.__images.push(image_item);

      // Switch to fill layout
      if (this.__layout === "fit") {
        writable.__layout = "fill";
      }
    } else {
      throw new Error("Maximum number of image items reached");
    }
  }

  /**
   * Removes an image item
   * @param index Index of the item to be removed
   */
  public remove_image_item(index: number): void {
    if (this.__images.length) {
      if (this.__images.length === 1) {
        this.remove(); // Remove the entire node when only a single item is present
      } else {
        const writable = this.getWritable();
        writable.__images.splice(index, 1);
      }
    } else {
      throw new Error("There are no more items to remove");
    }
  }

  /**
   * Returns all the image items
   */
  public get_image_items(): ImageItem[] {
    return this.__images;
  }

  /**
   * Changes the positions of image items in an anti-clockwise direction
   */
  public change_item_positions(): void {
    if (this.__images.length > 1) {
      const writable = this.getWritable();
      const popped = writable.__images.pop();

      if (popped) {
        writable.__images.unshift(popped);
      }
    }
  }

  /**
   * Sets the layout of the node
   * @param next_layout Layout
   */
  public set_layout(next_layout: ImageNodeLayout): void {
    const writable = this.getWritable();
    writable.__layout = next_layout;
  }

  /**
   * Sets the scale factor
   * @param next_scale_factor New scale factor
   */
  public set_scale_factor(next_scale_factor: number): void {
    if (this.__images.length === 1) {
      const writable = this.getWritable();
      writable.__images[0].scale_factor = clamp(
        MIN_SCALE_FACTOR,
        next_scale_factor,
        MAX_SCALE_FACTOR
      );
    }
  }

  /**
   * Sets the alt text
   * @param index Image index
   * @param alt_text New alt text
   */
  public set_alt_text(index: number, alt_text: string): void {
    const writable = this.getWritable();

    if (writable.__images[index]) {
      writable.__images[index].alt = alt_text;
    }
  }

  /**
   * Renders the decorator
   */
  override decorate(): React.ReactElement {
    return (
      <ImageComponent
        images={this.__images}
        layout={this.__layout}
        node_key={this.getKey()}
        resizable={this.__layout === "fit"}
      />
    );
  }
}

/**
 * Creates a new image node
 * @param images Image items
 * @param layout Node layout
 */
export const $create_image_node = ({
  images,
  layout
}: ImagePayload): ImageNode =>
  new ImageNode({
    images,
    layout
  });

/**
 * Predicate function for determining image nodes
 * @param node Node
 */
export const $is_image_node = (
  node: LexicalNode | null | undefined
): node is ImageNode => node instanceof ImageNode;
