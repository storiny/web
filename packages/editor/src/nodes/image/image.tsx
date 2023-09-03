import { AssetRating } from "@storiny/shared";
import { LexicalNode, NodeKey, Spread } from "lexical";
import React from "react";

import { clamp } from "~/utils/clamp";

import { BlockNode, SerializedBlockNode } from "../block";
import ImageComponent from "./component";

export interface ImagePayload {
  alt: string;
  height: number;
  hex: string;
  imgKey: string;
  key?: NodeKey;
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
    rating: AssetRating;
    scaleFactor: number;
    width: number;
  },
  SerializedBlockNode
>;

const TYPE = "image";
export const MIN_SCALE_FACTOR = 0.15;
export const MAX_SCALE_FACTOR = 1.5;

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
  }

  /**
   * Returns the type of the node
   */
  static getType(): string {
    return TYPE;
  }

  /**
   * Clones the node
   * @param node Node
   */
  static clone(node: ImageNode): ImageNode {
    return new ImageNode(
      {
        rating: node.__rating,
        height: node.__height,
        width: node.__width,
        hex: node.__hex,
        imgKey: node.__imgKey,
        alt: node.__alt,
        scaleFactor: node.__scaleFactor
      },
      node.__key
    );
  }

  /**
   * Imports a serialized node
   * @param serializedNode Serialized node
   */
  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    const { alt, height, width, scaleFactor, imgKey, hex, rating } =
      serializedNode;
    return $createImageNode({
      alt,
      height,
      width,
      scaleFactor,
      imgKey,
      hex,
      rating
    });
  }

  /**
   * CDN image key
   */
  __imgKey: string;
  /**
   * Alt text for the image
   */
  __alt: string;
  /**
   * Image hex color value
   */
  __hex: string;
  /**
   * Image rating
   */
  __rating: AssetRating;
  /**
   * Original image width
   */
  __width: number;
  /**
   * Original image height
   */
  __height: number;
  /**
   * The scale factor (used for resizing the image)
   */
  __scaleFactor: number;

  /**
   * Serializes the node to JSON
   */
  exportJSON(): SerializedImageNode {
    return {
      ...super.exportJSON(),
      alt: this.__alt,
      hex: this.__hex,
      height: this.__height,
      width: this.__width,
      imgKey: this.__imgKey,
      scaleFactor: this.__scaleFactor,
      rating: this.__rating,
      type: TYPE,
      version: 1
    };
  }

  /**
   * Sets the scale factor
   * @param scaleFactor New scale factor
   */
  setScaleFactor(scaleFactor: number): void {
    const writable = this.getWritable();
    writable.__scaleFactor = clamp(
      MIN_SCALE_FACTOR,
      scaleFactor,
      MAX_SCALE_FACTOR
    );
  }

  /**
   * Renders the decorators
   */
  decorate(): React.ReactElement {
    return (
      <ImageComponent
        alt={this.__alt}
        height={this.__height}
        imgKey={this.__imgKey}
        nodeKey={this.getKey()}
        rating={this.__rating}
        resizable={true}
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
  scaleFactor
}: ImagePayload): ImageNode =>
  new ImageNode({
    alt,
    imgKey,
    hex,
    height,
    width,
    scaleFactor,
    rating
  });

/**
 * Predicate function for determining image nodes
 * @param node Node
 */
export const $isImageNode = (
  node: LexicalNode | null | undefined
): node is ImageNode => node instanceof ImageNode;
