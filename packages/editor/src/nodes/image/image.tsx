import { LinkNode } from "@lexical/link";
import { AssetRating } from "@storiny/shared";
import { devConsole } from "@storiny/shared/src/utils/devLog";
import {
  $applyNodeReplacement,
  createEditor,
  DecoratorNode,
  DOMExportOutput,
  EditorConfig,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  SerializedEditor,
  SerializedLexicalNode,
  Spread
} from "lexical";
import React from "react";

import { clamp } from "~/utils/clamp";
import { getCdnUrl } from "~/utils/getCdnUrl";

import { EditorNamespace } from "../../constants";
import { ColorNode } from "../color";
import ImageComponent from "./component";

export interface ImagePayload {
  alt: string;
  caption?: LexicalEditor;
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
    caption: SerializedEditor;
    height: number;
    hex: string;
    imgKey: string;
    rating: AssetRating;
    scaleFactor: number;
    width: number;
  },
  SerializedLexicalNode
>;

const TYPE = "image";
const MIN_SCALE_FACTOR = 0.5;
const MAX_SCALE_FACTOR = 5;

// const convertImageElement = (domNode: Node): null | DOMConversionOutput => {
//   if (domNode instanceof HTMLImageElement) {
//     const { alt, src, width, height } = domNode;
//     const node = $createImageNode({ alt, height, src, width });
//     return { node };
//   }
//
//   return null;
// };

export class ImageNode extends DecoratorNode<React.ReactElement> {
  constructor(
    {
      rating,
      caption,
      imgKey,
      hex,
      width,
      height,
      alt,
      scaleFactor
    }: Omit<ImagePayload, "key">,
    key?: NodeKey
  ) {
    super(key);
    this.__imgKey = imgKey;
    this.__alt = alt;
    this.__hex = hex;
    this.__width = width;
    this.__height = height;
    this.__caption =
      caption ||
      createEditor({
        namespace: EditorNamespace.IMAGE_CAPTION,
        nodes: [ColorNode, LinkNode],
        onError: devConsole.error
      });
    this.__scaleFactor = scaleFactor || 1;
    this.__rating = rating;
  }

  static getType(): string {
    return TYPE;
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(
      {
        rating: node.__rating,
        caption: node.__caption,
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

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    const { alt, height, width, scaleFactor, caption, imgKey, hex, rating } =
      serializedNode;
    const node = $createImageNode({
      alt,
      height,
      width,
      scaleFactor,
      imgKey,
      hex,
      rating
    });
    const nestedEditor = node.__caption;
    const editorState = nestedEditor.parseEditorState(caption.editorState);

    if (!editorState.isEmpty()) {
      nestedEditor.setEditorState(editorState);
    }

    return node;
  }

  // static importDOM(): DOMConversionMap | null {
  //   return {
  //     img: () => ({
  //       conversion: convertImageElement,
  //       priority: 0
  //     })
  //   };
  // }

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
   * Image caption
   */
  __caption: LexicalEditor;

  exportDOM(): DOMExportOutput {
    const element = document.createElement("img");
    element.setAttribute("src", getCdnUrl(this.__imgKey));
    element.setAttribute("alt", this.__alt);
    element.setAttribute(
      "width",
      (this.__width * this.__scaleFactor).toString()
    );
    element.setAttribute(
      "height",
      (this.__height * this.__scaleFactor).toString()
    );
    return { element };
  }

  exportJSON(): SerializedImageNode {
    return {
      alt: this.__alt,
      hex: this.__hex,
      caption: this.__caption.toJSON(),
      height: this.__height,
      width: this.__width,
      imgKey: this.__imgKey,
      scaleFactor: this.__scaleFactor,
      rating: this.__rating,
      type: TYPE,
      version: 1
    };
  }

  setScaleFactor(scaleFactor: number): void {
    const writable = this.getWritable();
    writable.__scaleFactor = clamp(
      MIN_SCALE_FACTOR,
      scaleFactor,
      MAX_SCALE_FACTOR
    );
  }

  // View

  createDOM(config: EditorConfig): HTMLElement {
    const figure = document.createElement("figure");
    const theme = config.theme;
    const className = theme.image;
    if (className !== undefined) {
      figure.className = className;
    }
    return figure;
  }

  isInline(): false {
    return false;
  }

  updateDOM(): false {
    return false;
  }

  decorate(): React.ReactElement {
    return (
      <ImageComponent
        alt={this.__alt}
        caption={this.__caption}
        height={this.__height}
        imgKey={this.__imgKey}
        nodeKey={this.getKey()}
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
 * @param key Node key
 */
export const $createImageNode = ({
  alt,
  imgKey,
  hex,
  height,
  width,
  caption,
  rating,
  scaleFactor,
  key
}: ImagePayload): ImageNode =>
  $applyNodeReplacement(
    new ImageNode(
      { alt, imgKey, hex, height, width, scaleFactor, caption, rating },
      key
    )
  );

/**
 * Predicate function for determining image nodes
 * @param node Node
 */
export const $isImageNode = (
  node: LexicalNode | null | undefined
): node is ImageNode => node instanceof ImageNode;
