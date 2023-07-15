import { nanoid } from "nanoid";
import React from "react";

import { ImageMime, Mime, NonImageMime } from "../../../constants";
import { cleanAppStateForExport } from "../../../core/appState";
import { IMAGE_MIME_TYPES, MIME_TYPES } from "../../../core/constants";
import { CanvasError } from "../../../core/errors";
import { clearLayersForExport } from "../../../core/layer";
import { FileId } from "../../../core/layer/types";
import { DataURL } from "../../../core/types";
import { ValueOf } from "../../../core/utility-types";
import { bytesToHexString } from "../../../core/utils";
import { EditorState, Layer } from "../../../types";
import { calculateScrollCenter } from "../../scene";
import { FileSystemHandle, nativeFileSystemSupported } from "../fs/filesystem";
import { isValidExcalidrawData } from "../json/json";
import { restore } from "../restore/restore";

/**
 * Parses data from a blob or file
 * @param blob Blob or file
 */
const parseFileContents = async (blob: Blob | File): Promise<string> => {
  let contents: string;

  if (blob.type === ImageMime.PNG) {
    try {
      return await (await import("../image/image")).decodePngMetadata(blob);
    } catch (error: any) {
      if (error.message === "INVALID") {
        throw new DOMException(
          "This image does not seem to contain any scene data.",
          "EncodingError"
        );
      } else {
        throw new DOMException(
          "Scene couldn't be restored from this image file",
          "EncodingError"
        );
      }
    }
  } else {
    if ("text" in Blob) {
      contents = await blob.text();
    } else {
      contents = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsText(blob, "utf8");
        reader.onloadend = (): void => {
          if (reader.readyState === FileReader.DONE) {
            resolve(reader.result as string);
          }
        };
      });
    }

    if (blob.type === ImageMime.SVG) {
      try {
        return await (
          await import("../image/image")
        ).decodeSvgMetadata({
          svg: contents
        });
      } catch (error: any) {
        if (error.message === "INVALID") {
          throw new DOMException(
            "This image does not seem to contain any scene data.",
            "EncodingError"
          );
        } else {
          throw new DOMException(
            "Scene couldn't be restored from this image file",
            "EncodingError"
          );
        }
      }
    }
  }

  return contents;
};

/**
 * Returns the mime type of blob
 * @param blob Blob
 */
export const getMimeType = (blob: Blob | string): string => {
  let name: string;

  if (typeof blob === "string") {
    name = blob;
  } else {
    if (blob.type) {
      return blob.type;
    }

    name = blob.name || "";
  }

  if (/\.(excalidraw|json)$/.test(name)) {
    return NonImageMime.JSON;
  } else if (/\.png$/.test(name)) {
    return ImageMime.PNG;
  } else if (/\.jpe?g$/.test(name)) {
    return ImageMime.JPG;
  } else if (/\.svg$/.test(name)) {
    return ImageMime.SVG;
  }

  return "";
};

/**
 * Returns the file type
 * @param handle File handle
 */
export const getFileHandleType = (
  handle: FileSystemHandle | null
): string | null => {
  if (!handle) {
    return null;
  }

  return handle.name.match(/\.(json|excalidraw|png|svg)$/)?.[1] || null;
};

/**
 * Function for checking image file type
 * @param type Type
 */
export const isImageFileHandleType = (
  type: string | null
): type is "png" | "svg" => type === "png" || type === "svg";

/**
 * Predicate function for checking for image file handles
 * @param handle File handle
 */
export const isImageFileHandle = (handle: FileSystemHandle | null): boolean => {
  const type = getFileHandleType(handle);
  return type === "png" || type === "svg";
};

/**
 * Predicate function for checking image file support
 * @param blob Blobl
 */
export const isSupportedImageFile = (
  blob: Blob | null | undefined
): blob is Blob & { type: ValueOf<typeof IMAGE_MIME_TYPES> } => {
  const { type } = blob || {};
  return !!type && (Object.values(ImageMime) as string[]).includes(type);
};

/**
 * Loads scene data from a blob
 * @param blob Blob or file
 * @param localEditorState Local editor state
 * @param localLayers Local layers
 * @param fileHandle File handle
 */
export const loadSceneFromBlob = async (
  blob: Blob | File,
  localEditorState: EditorState | null,
  localLayers: readonly Layer[] | null,
  // Defaults to `blob.handle` if defined, `null` otherwise
  fileHandle?: FileSystemHandle | null
): Promise<{ data: RestoredDataState; type: NonImageMime }> => {
  const contents = await parseFileContents(blob);

  try {
    const data = JSON.parse(contents);
    if (isValidExcalidrawData(data)) {
      return {
        type: NonImageMime.EXCALIDRAW,
        data: restore(
          {
            layers: clearLayersForExport(data.layers || []),
            appState: {
              fileHandle: fileHandle || blob.handle || null,
              ...cleanAppStateForExport(data.appState || {}),
              ...(localEditorState
                ? calculateScrollCenter(
                    data.layers || [],
                    localEditorState,
                    null
                  )
                : {})
            },
            files: data.files
          },
          localEditorState,
          localLayers,
          { repairBindings: true, refreshDimensions: false }
        )
      };
    }

    throw new Error("Couldn't load invalid file");
  } catch (error: any) {
    throw new Error("Couldn't load invalid file");
  }
};

/**
 * Loads data from blob
 * @param blob Blob
 * @param localEditorState Local editor state
 * @param localLayers Local layers
 * @param fileHandle File handle
 */
export const loadFromBlob = async (
  blob: Blob,
  localEditorState: EditorState | null,
  localLayers: readonly Layer[] | null,
  // Defaults to `blob.handle` if defined, `null` otherwise
  fileHandle?: FileSystemHandle | null
): Promise<RestoredDataState> => {
  const restored = await loadSceneFromBlob(
    blob,
    localEditorState,
    localLayers,
    fileHandle
  );

  if (restored.type !== NonImageMime.EXCALIDRAW) {
    throw new Error("Couldn't load invalid file");
  }

  return restored.data;
};

/**
 * Converts canvas data to blob
 * @param canvas Canvas layer
 */
export const canvasToBlob = async (canvas: HTMLCanvasLayer): Promise<Blob> =>
  new Promise((resolve, reject) => {
    try {
      canvas.toBlob((blob) => {
        if (!blob) {
          return reject(
            new CanvasError(
              "The canvas might be too big.",
              "CANVAS_POSSIBLY_TOO_BIG"
            )
          );
        }

        resolve(blob);
      });
    } catch (error: any) {
      reject(error);
    }
  });

/**
 * Generates SHA-1 digest from supplied file (if not supported, falls back
 * to a 40-char base64 random id)
 * @param file File
 */
export const generateIdFromFile = async (file: File): Promise<FileId> => {
  try {
    const hashBuffer = await window.crypto.subtle.digest(
      "SHA-1",
      await blobToArrayBuffer(file)
    );
    return bytesToHexString(new Uint8Array(hashBuffer)) as FileId;
  } catch (error: any) {
    // Length 40 to align with the HEX length of SHA-1 (which is 160 bit)
    return nanoid(40) as FileId;
  }
};

/**
 * Returns the dataURL of a file
 * @param file File
 */
export const getDataURL = async (file: Blob | File): Promise<DataURL> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (): void => {
      const dataURL = reader.result as DataURL;
      resolve(dataURL);
    };

    reader.onerror = (error): void => reject(error);
    reader.readAsDataURL(file);
  });

/**
 * Converts dataURL to file
 * @param dataURL dataURL
 * @param filename Name of the new file
 */
export const dataURLToFile = (dataURL: DataURL, filename = ""): File => {
  const dataIndexStart = dataURL.indexOf(",");
  const byteString = atob(dataURL.slice(dataIndexStart + 1));
  const mimeType = dataURL.slice(0, dataIndexStart).split(":")[1].split(";")[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);

  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }

  return new File([ab], filename, { type: mimeType });
};

/**
 * Resizes an image file
 * @param file Image file
 * @param opts Resize options
 */
export const resizeImageFile = async (
  file: File,
  opts: {
    maxWidthOrHeight: number;
    // `undefined` indicates auto
    outputType?: ImageMime.JPG;
  }
): Promise<File> => {
  // SVG files can't be resized
  if (file.type === ImageMime.SVG) {
    return file;
  }

  const [pica, imageBlobReduce] = await Promise.all([
    import("pica").then((res) => res.default),
    // A wrapper for pica for better API
    import("image-blob-reduce").then((res) => res.default)
  ]);

  const reduce = imageBlobReduce({
    pica: pica({ features: ["js", "wasm"] })
  });

  if (opts.outputType) {
    const { outputType } = opts;
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    reduce._create_blob = function (env) {
      return this.pica.toBlob(env.out_canvas, outputType, 0.8).then((blob) => {
        env.out_blob = blob;
        return env;
      });
    };
  }

  if (!isSupportedImageFile(file)) {
    throw new Error("Unsupported file type");
  }

  return new File(
    [await reduce.toBlob(file, { max: opts.maxWidthOrHeight })],
    file.name,
    {
      type: opts.outputType || file.type
    }
  );
};

/**
 * Converts SVG string to SVG file
 * @param svgString SVG string
 * @param filename Output filename
 * @constructor
 */
export const svgStringToFile = (
  svgString: string,
  filename: string = ""
): File & { type: ImageMime.SVG } =>
  new File([new TextEncoder().encode(svgString)], filename, {
    type: MIME_TYPES.svg
  }) as File & { type: ImageMime.SVG };

/**
 * Returns file from drag event
 * @param event Drag event
 */
export const getFileFromEvent = async (
  event: React.DragEvent<HTMLDivLayer>
): Promise<{ file: File | null; fileHandle: FileSystemHandle | null }> => {
  const file = event.dataTransfer.files.item(0);
  const fileHandle = await getFileHandle(event);

  return { file: file ? await normalizeFile(file) : null, fileHandle };
};

/**
 * Returns file handle from a drag event
 * @param event Drag event
 */
export const getFileHandle = async (
  event: React.DragEvent<HTMLDivLayer>
): Promise<FileSystemHandle | null> => {
  if (nativeFileSystemSupported) {
    try {
      const item = event.dataTransfer.items[0];
      return (await (item as any).getAsFileSystemHandle()) || null;
    } catch (error: any) {
      return null;
    }
  }

  return null;
};

/**
 * Attempts to detect if a buffer is a valid image by checking its leading bytes
 * @param buffer File bytes
 */
const getActualMimeTypeFromImage = (
  buffer: ArrayBuffer
): ImageMime.PNG | ImageMime.GIF | ImageMime.JPG | null => {
  let mimeType: ImageMime.PNG | ImageMime.JPG | ImageMime.GIF | null = null;
  const first8Bytes = `${[...new Uint8Array(buffer).slice(0, 8)].join(" ")} `;

  // UINT-8 leading bytes
  const headerBytes = {
    // https://en.wikipedia.org/wiki/Portable_Network_Graphics#File_header
    png: "137 80 78 71 13 10 26 10 ",
    // https://en.wikipedia.org/wiki/JPEG#Syntax_and_structure
    // JPG is a bit wonky, checking the first three bytes should be enough,
    // but may yield false positives. (https://stackoverflow.com/a/23360709/927631)
    jpg: "255 216 255 ",
    // https://en.wikipedia.org/wiki/GIF#Example_GIF_file
    gif: "71 73 70 56 57 97 "
  };

  if (first8Bytes === headerBytes.png) {
    mimeType = ImageMime.PNG;
  } else if (first8Bytes.startsWith(headerBytes.jpg)) {
    mimeType = ImageMime.JPG;
  } else if (first8Bytes.startsWith(headerBytes.gif)) {
    mimeType = ImageMime.GIF;
  }
  return mimeType;
};

/**
 * Creates a file from blob
 * @param blob Blob
 * @param mimeType File mime type
 * @param name File name
 */
export const createFile = (
  blob: File | Blob | ArrayBuffer,
  mimeType: Mime,
  name: string | undefined
): File =>
  new File([blob], name || "", {
    type: mimeType
  });

/**
 * Attempts to detect correct mimeType if none is set, or if an image
 * has an incorrect extension
 * @param file File
 */
export const normalizeFile = async (file: File): Promise<File> => {
  if (!file.type) {
    if (file?.name?.endsWith(".excalidraw")) {
      file = createFile(
        await blobToArrayBuffer(file),
        NonImageMime.EXCALIDRAW,
        file.name
      );
    } else {
      const buffer = await blobToArrayBuffer(file);
      const mimeType = getActualMimeTypeFromImage(buffer);
      if (mimeType) {
        file = createFile(buffer, mimeType, file.name);
      }
    }
    // When the file is an image, make sure the extension corresponds to the
    // actual mimeType (this is an edge case, but happens sometime)
  } else if (isSupportedImageFile(file)) {
    const buffer = await blobToArrayBuffer(file);
    const mimeType = getActualMimeTypeFromImage(buffer);
    if (mimeType && mimeType !== file.type) {
      file = createFile(buffer, mimeType, file.name);
    }
  }

  return file;
};

/**
 * Converts a blob to array buffer
 * @param blob Blob
 */
export const blobToArrayBuffer = (blob: Blob): Promise<ArrayBuffer> => {
  if ("arrayBuffer" in blob) {
    return blob.arrayBuffer();
  }

  // Safari
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event): void => {
      if (!event.target?.result) {
        return reject(new Error("Unable to convert blob to ArrayBuffer"));
      }
      resolve(event.target.result as ArrayBuffer);
    };

    reader.readAsArrayBuffer(blob);
  });
};
