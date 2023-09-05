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
  scaleFactor: number;
  width: number;
}

export interface ImagePayload {
  images: Array<
    Omit<ImageItem, "scaleFactor"> & Partial<Pick<ImageItem, "scaleFactor">>
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
        scaleFactor: image.scaleFactor || 1
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
   * @param serializedNode Serialized node
   */
  static override importJSON(serializedNode: SerializedImageNode): ImageNode {
    return $createImageNode({
      images: [...serializedNode.images],
      layout: serializedNode.layout
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
  public getLayout(): ImageNodeLayout {
    return this.__layout;
  }

  /**
   * Adds a new image item
   * @param imageItem Image item
   */
  public addImageItem(imageItem: ImageItem): void {
    if (this.__images.length < MAX_IMAGE_ITEMS) {
      const writable = this.getWritable();
      writable.__images.push(imageItem);

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
  public removeImageItem(index: number): void {
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
  public getImageItems(): ImageItem[] {
    return this.__images;
  }

  /**
   * Changes the positions of image items in an anti-clockwise direction
   */
  public changeItemPositions(): void {
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
   * @param layout Layout
   */
  public setLayout(layout: ImageNodeLayout): void {
    const writable = this.getWritable();
    writable.__layout = layout;
  }

  /**
   * Sets the scale factor
   * @param scaleFactor New scale factor
   */
  public setScaleFactor(scaleFactor: number): void {
    if (this.__images.length === 1) {
      const writable = this.getWritable();
      writable.__images[0].scaleFactor = clamp(
        MIN_SCALE_FACTOR,
        scaleFactor,
        MAX_SCALE_FACTOR
      );
    }
  }

  /**
   * Sets the alt text
   * @param index Image index
   * @param altText New alt text
   */
  public setAltText(index: number, altText: string): void {
    const writable = this.getWritable();

    if (writable.__images[index]) {
      writable.__images[index].alt = altText;
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
        nodeKey={this.getKey()}
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
export const $createImageNode = ({ images, layout }: ImagePayload): ImageNode =>
  new ImageNode({
    images,
    layout
  });

/**
 * Predicate function for determining image nodes
 * @param node Node
 */
export const $isImageNode = (
  node: LexicalNode | null | undefined
): node is ImageNode => node instanceof ImageNode;
