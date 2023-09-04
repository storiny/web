import { AssetRating } from "@storiny/shared";
import { LexicalNode, NodeKey, Spread } from "lexical";
import React from "react";

import { clamp } from "~/utils/clamp";

import { BlockNode, SerializedBlockNode } from "../block";
import ImageComponent from "./component";

export type ImageNodeLayout = "fit" | "fill" | "overflow";

export interface ImagePayload {
  alt: string;
  height: number;
  hex: string;
  imgKey: string;
  key?: NodeKey;
  layout?: ImageNodeLayout;
  rating: AssetRating;
  scaleFactor?: number;
  width: number;
}

export type SerializedImageNode = Spread<
  {
    alt: string;
    height: number;
    hex: string;
    imgKey: string;
    layout: ImageNodeLayout;
    rating: AssetRating;
    scaleFactor: number;
    width: number;
  },
  SerializedBlockNode
>;

const TYPE = "image";
const VERSION = 1;

export const MIN_SCALE_FACTOR = 0.15;
export const MAX_SCALE_FACTOR = 1.5;

// noinspection TypeScriptFieldCanBeMadeReadonly
export class ImageNode extends BlockNode {
  /**
   * Ctor
   * @param rating Image rating
   * @param imgKey CDN key
   * @param hex Image average hex color value
   * @param width Image width
   * @param height Image height
   * @param alt Alt text
   * @param scaleFactor Scale factor
   * @param layout Image layout
   * @param key Node key
   */
  constructor(
    {
      rating,
      imgKey,
      hex,
      width,
      height,
      alt,
      layout,
      scaleFactor
    }: Omit<ImagePayload, "key"> = {} as any,
    key?: NodeKey
  ) {
    super(key);
    this.__imgKey = imgKey;
    this.__alt = alt;
    this.__hex = hex;
    this.__width = width;
    this.__height = height;
    this.__scaleFactor = scaleFactor || 1;
    this.__rating = rating;
    this.__layout = layout || "fit";
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
        rating: node.__rating,
        height: node.__height,
        width: node.__width,
        hex: node.__hex,
        imgKey: node.__imgKey,
        alt: node.__alt,
        scaleFactor: node.__scaleFactor,
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
      alt: serializedNode.alt,
      height: serializedNode.height,
      width: serializedNode.width,
      scaleFactor: serializedNode.scaleFactor,
      imgKey: serializedNode.imgKey,
      hex: serializedNode.hex,
      rating: serializedNode.rating,
      layout: serializedNode.layout
    });
  }

  /**
   * CDN image key
   * @private
   */
  private readonly __imgKey: string;
  /**
   * Image hex color value
   * @private
   */
  private readonly __hex: string;
  /**
   * Image rating
   * @private
   */
  private readonly __rating: AssetRating;
  /**
   * Original image width
   * @private
   */
  private readonly __width: number;
  /**
   * Original image height
   * @private
   */
  private readonly __height: number;
  /**
   * Image layout
   * @private
   */
  private __layout: ImageNodeLayout;
  /**
   * Alt text for the image
   * @private
   */
  private __alt: string;
  /**
   * The scale factor (used for resizing the image)
   * @private
   */
  private __scaleFactor: number;

  /**
   * Serializes the node to JSON
   */
  override exportJSON(): SerializedImageNode {
    return {
      ...super.exportJSON(),
      alt: this.__alt,
      hex: this.__hex,
      height: this.__height,
      width: this.__width,
      imgKey: this.__imgKey,
      scaleFactor: this.__scaleFactor,
      rating: this.__rating,
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
    const writable = this.getWritable();
    writable.__scaleFactor = clamp(
      MIN_SCALE_FACTOR,
      scaleFactor,
      MAX_SCALE_FACTOR
    );
  }

  /**
   * Sets the alt text
   * @param altText New alt text
   */
  public setAltText(altText: string): void {
    const writable = this.getWritable();
    writable.__alt = altText;
  }

  /**
   * Renders the decorator
   */
  override decorate(): React.ReactElement {
    return (
      <ImageComponent
        alt={this.__alt}
        height={this.__height}
        imgKey={this.__imgKey}
        layout={this.__layout}
        nodeKey={this.getKey()}
        rating={this.__rating}
        resizable={this.__layout === "fit"}
        scaleFactor={this.__scaleFactor}
        width={this.__width}
      />
    );
  }
}

/**
 * Creates a new image node
 * @param alt Alt text
 * @param imgKey CDN key
 * @param hex Average hex color of the image
 * @param height Image height
 * @param width Image width
 * @param caption Image caption
 * @param rating Image rating
 * @param scaleFactor Scale factor
 */
export const $createImageNode = ({
  alt,
  imgKey,
  hex,
  height,
  width,
  rating,
  scaleFactor,
  layout
}: ImagePayload): ImageNode =>
  new ImageNode({
    alt,
    imgKey,
    hex,
    height,
    width,
    scaleFactor,
    rating,
    layout
  });

/**
 * Predicate function for determining image nodes
 * @param node Node
 */
export const $isImageNode = (
  node: LexicalNode | null | undefined
): node is ImageNode => node instanceof ImageNode;
