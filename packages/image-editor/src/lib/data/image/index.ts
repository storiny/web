import { devConsole } from "@storiny/shared/src/utils/devLog";
import tEXt from "png-chunk-text";
import encodePng from "png-chunks-encode";
import decodePng from "png-chunks-extract";

import { ImageMime, NonImageMime } from "../../../constants";
import { blobToArrayBuffer } from "../blob";
import { base64ToString, decode, encode, stringToBase64 } from "../encode";

// PNG

/**
 * Returns PNG tEXt chunk
 * @param blob Blob
 */
export const getTEXtChunk = async (
  blob: Blob
): Promise<{ keyword: string; text: string } | null> => {
  const chunks = decodePng(new Uint8Array(await blobToArrayBuffer(blob)));
  const metadataChunk = chunks.find((chunk) => chunk.name === "tEXt");

  if (metadataChunk) {
    return tEXt.decode(metadataChunk.data);
  }

  return null;
};

/**
 * Encodes PNG metadata
 * @param blob Image blob
 * @param metadata Metadata to encode
 */
export const encodePngMetadata = async ({
  blob,
  metadata
}: {
  blob: Blob;
  metadata: string;
}): Promise<Blob> => {
  const chunks = decodePng(new Uint8Array(await blobToArrayBuffer(blob)));
  const metadataChunk = tEXt.encode(
    NonImageMime.EXCALIDRAW,
    JSON.stringify(
      await encode({
        text: metadata,
        compress: true
      })
    )
  );

  // Insert metadata before last chunk (iEND)
  chunks.splice(-1, 0, metadataChunk);
  return new Blob([encodePng(chunks)], { type: ImageMime.PNG });
};

/**
 * Decodes PNG metadata
 * @param blob Image blob
 */
export const decodePngMetadata = async (blob: Blob): Promise<string> => {
  const metadata = await getTEXtChunk(blob);
  if (metadata?.keyword === NonImageMime.EXCALIDRAW) {
    try {
      const encodedData = JSON.parse(metadata.text);
      return await decode(encodedData);
    } catch (error: any) {
      devConsole.error(error);
      throw new Error("Decoding failed");
    }
  }

  throw new Error("INVALID");
};

// SVG

/**
 * Encodes SVG metadata
 * @param text SVG text
 */
export const encodeSvgMetadata = async ({
  text
}: {
  text: string;
}): Promise<string> => {
  const base64 = await stringToBase64(
    JSON.stringify(await encode({ text })),
    true /* Is already byte string */
  );

  let metadata = "";
  metadata += `<!-- payload-type:${NonImageMime.EXCALIDRAW} -->`;
  metadata += `<!-- payload-version:1 -->`;
  metadata += "<!-- payload-start -->";
  metadata += base64;
  metadata += "<!-- payload-end -->";

  return metadata;
};

/**
 * Decodes SVG metadata
 * @param svg SVG text
 */
export const decodeSvgMetadata = async ({
  svg
}: {
  svg: string;
}): Promise<string> => {
  if (svg.includes(`payload-type:${NonImageMime.EXCALIDRAW}`)) {
    const match = svg.match(
      /<!-- payload-start -->\s*(.+?)\s*<!-- payload-end -->/
    );

    if (!match) {
      throw new Error("Decoding failed: Invalid metadata");
    }

    try {
      const json = await base64ToString(match[1], true);
      return await decode(JSON.parse(json));
    } catch (error: any) {
      devConsole.error(error);
      throw new Error("Parsing failed");
    }
  }

  throw new Error("Invalid data");
};
