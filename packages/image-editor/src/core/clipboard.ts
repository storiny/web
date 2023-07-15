import { SVG_EXPORT_TAG } from "../lib/scene/export";
import { Spreadsheet, tryParseSpreadsheet, VALID_SPREADSHEET } from "./charts";
import { EXPORT_DATA_TYPES, MIME_TYPES } from "./constants";
import { getContainingFrame } from "./frame";
import { mutateLayer } from "./layer/mutateLayer";
import { deepCopyLayer } from "./layer/newLayer";
import { isInitializedImageLayer } from "./layer/typeChecks";
import { ExcalidrawLayer, NonDeletedExcalidrawLayer } from "./layer/types";
import { BinaryFiles } from "./types";
import { isPromiseLike, isTestEnv } from "./utils";

type LayersClipboard = {
  files: BinaryFiles | undefined;
  layers: readonly NonDeletedExcalidrawLayer[];
  type: typeof EXPORT_DATA_TYPES.excalidrawClipboard;
};

export interface ClipboardData {
  errorMessage?: string;
  files?: BinaryFiles;
  layers?: readonly ExcalidrawLayer[];
  spreadsheet?: Spreadsheet;
  text?: string;
}

let CLIPBOARD = "";
let PREFER_APP_CLIPBOARD = false;

export const probablySupportsClipboardReadText =
  "clipboard" in navigator && "readText" in navigator.clipboard;

export const probablySupportsClipboardWriteText =
  "clipboard" in navigator && "writeText" in navigator.clipboard;

export const probablySupportsClipboardBlob =
  "clipboard" in navigator &&
  "write" in navigator.clipboard &&
  "ClipboardItem" in window &&
  "toBlob" in HTMLCanvasLayer.prototype;

const clipboardContainsLayers = (
  contents: any
): contents is { files?: BinaryFiles; layers: ExcalidrawLayer[] } => {
  if (
    [
      EXPORT_DATA_TYPES.excalidraw,
      EXPORT_DATA_TYPES.excalidrawClipboard
    ].includes(contents?.type) &&
    Array.isArray(contents.layers)
  ) {
    return true;
  }
  return false;
};

export const copyToClipboard = async (
  layers: readonly NonDeletedExcalidrawLayer[],
  files: BinaryFiles | null
) => {
  const framesToCopy = new Set(
    layers.filter((layer) => layer.type === "frame")
  );
  let foundFile = false;

  const _files = layers.reduce((acc, layer) => {
    if (isInitializedImageLayer(layer)) {
      foundFile = true;
      if (files && files[layer.fileId]) {
        acc[layer.fileId] = files[layer.fileId];
      }
    }
    return acc;
  }, {} as BinaryFiles);

  if (foundFile && !files) {
    console.warn(
      "copyToClipboard: attempting to file layer(s) without providing associated `files` object."
    );
  }

  // select binded text layers when copying
  const contents: LayersClipboard = {
    type: EXPORT_DATA_TYPES.excalidrawClipboard,
    layers: layers.map((layer) => {
      if (
        getContainingFrame(layer) &&
        !framesToCopy.has(getContainingFrame(layer)!)
      ) {
        const copiedLayer = deepCopyLayer(layer);
        mutateLayer(copiedLayer, {
          frameId: null
        });
        return copiedLayer;
      }

      return layer;
    }),
    files: files ? _files : undefined
  };
  const json = JSON.stringify(contents);

  if (isTestEnv()) {
    return json;
  }

  CLIPBOARD = json;

  try {
    PREFER_APP_CLIPBOARD = false;
    await copyTextToSystemClipboard(json);
  } catch (error: any) {
    PREFER_APP_CLIPBOARD = true;
    console.error(error);
  }
};

const getAppClipboard = (): Partial<LayersClipboard> => {
  if (!CLIPBOARD) {
    return {};
  }

  try {
    return JSON.parse(CLIPBOARD);
  } catch (error: any) {
    console.error(error);
    return {};
  }
};

const parsePotentialSpreadsheet = (
  text: string
): { spreadsheet: Spreadsheet } | { errorMessage: string } | null => {
  const result = tryParseSpreadsheet(text);
  if (result.type === VALID_SPREADSHEET) {
    return { spreadsheet: result.spreadsheet };
  }
  return null;
};

/**
 * Retrieves content from system clipboard (either from ClipboardEvent or
 *  via async clipboard API if supported)
 */
export const getSystemClipboard = async (
  event: ClipboardEvent | null
): Promise<string> => {
  try {
    const text = event
      ? event.clipboardData?.getData("text/plain")
      : probablySupportsClipboardReadText &&
        (await navigator.clipboard.readText());

    return (text || "").trim();
  } catch {
    return "";
  }
};

/**
 * Attempts to parse clipboard. Prefers system clipboard.
 */
export const parseClipboard = async (
  event: ClipboardEvent | null,
  isPlainPaste = false
): Promise<ClipboardData> => {
  const systemClipboard = await getSystemClipboard(event);

  // if system clipboard empty, couldn't be resolved, or contains previously
  // copied excalidraw scene as SVG, fall back to previously copied excalidraw
  // layers
  if (
    !systemClipboard ||
    (!isPlainPaste && systemClipboard.includes(SVG_EXPORT_TAG))
  ) {
    return getAppClipboard();
  }

  // if system clipboard contains spreadsheet, use it even though it's
  // technically possible it's staler than in-app clipboard
  const spreadsheetResult =
    !isPlainPaste && parsePotentialSpreadsheet(systemClipboard);

  if (spreadsheetResult) {
    return spreadsheetResult;
  }

  const appClipboardData = getAppClipboard();

  try {
    const systemClipboardData = JSON.parse(systemClipboard);
    if (clipboardContainsLayers(systemClipboardData)) {
      return {
        layers: systemClipboardData.layers,
        files: systemClipboardData.files,
        text: isPlainPaste
          ? JSON.stringify(systemClipboardData.layers, null, 2)
          : undefined
      };
    }
  } catch (e) {}
  // system clipboard doesn't contain excalidraw layers → return plaintext
  // unless we set a flag to prefer in-app clipboard because browser didn't
  // support storing to system clipboard on copy
  return PREFER_APP_CLIPBOARD && appClipboardData.layers
    ? {
        ...appClipboardData,
        text: isPlainPaste
          ? JSON.stringify(appClipboardData.layers, null, 2)
          : undefined
      }
    : { text: systemClipboard };
};

export const copyBlobToClipboardAsPng = async (blob: Blob | Promise<Blob>) => {
  try {
    // in Safari so far we need to construct the ClipboardItem synchronously
    // (i.e. in the same tick) otherwise browser will complain for lack of
    // user intent. Using a Promise ClipboardItem constructor solves this.
    // https://bugs.webkit.org/show_bug.cgi?id=222262
    //
    // Note that Firefox (and potentially others) seems to support Promise
    // ClipboardItem constructor, but throws on an unrelated MIME type error.
    // So we need to await this and fallback to awaiting the blob if applicable.
    await navigator.clipboard.write([
      new window.ClipboardItem({
        [MIME_TYPES.png]: blob
      })
    ]);
  } catch (error: any) {
    // if we're using a Promise ClipboardItem, let's try constructing
    // with resolution value instead
    if (isPromiseLike(blob)) {
      await navigator.clipboard.write([
        new window.ClipboardItem({
          [MIME_TYPES.png]: await blob
        })
      ]);
    } else {
      throw error;
    }
  }
};

export const copyTextToSystemClipboard = async (text: string | null) => {
  let copied = false;
  if (probablySupportsClipboardWriteText) {
    try {
      // NOTE: doesn't work on FF on non-HTTPS domains, or when document
      // not focused
      await navigator.clipboard.writeText(text || "");
      copied = true;
    } catch (error: any) {
      console.error(error);
    }
  }

  // Note that execCommand doesn't allow copying empty strings, so if we're
  // clearing clipboard using this API, we must copy at least an empty char
  if (!copied && !copyTextViaExecCommand(text || " ")) {
    throw new Error("couldn't copy");
  }
};

// adapted from https://github.com/zenorocha/clipboard.js/blob/ce79f170aa655c408b6aab33c9472e8e4fa52e19/src/clipboard-action.js#L48
const copyTextViaExecCommand = (text: string) => {
  const isRTL = document.documentLayer.getAttribute("dir") === "rtl";

  const textarea = document.createLayer("textarea");

  textarea.style.border = "0";
  textarea.style.padding = "0";
  textarea.style.margin = "0";
  textarea.style.position = "absolute";
  textarea.style[isRTL ? "right" : "left"] = "-9999px";
  const yPosition = window.pageYOffset || document.documentLayer.scrollTop;
  textarea.style.top = `${yPosition}px`;
  // Prevent zooming on iOS
  textarea.style.fontSize = "12pt";

  textarea.setAttribute("readonly", "");
  textarea.value = text;

  document.body.appendChild(textarea);

  let success = false;

  try {
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);

    success = document.execCommand("copy");
  } catch (error: any) {
    console.error(error);
  }

  textarea.remove();

  return success;
};
