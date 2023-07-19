import { devConsole } from "@storiny/shared/src/utils/devLog";
import { isTestEnv } from "@storiny/shared/src/utils/isTestEnv";

import { ImageMime } from "../../constants";
import { EXPORT_DATA_TYPES } from "../../constants/new";
import { BinaryFiles, Layer, NonDeletedLayer, Spreadsheet } from "../../types";
import { tryParseSpreadsheet, VALID_SPREADSHEET } from "../chart";
import { isInitializedImageLayer } from "../layer";
import { isPromiseLike } from "../utils";

type LayersClipboard = {
  files: BinaryFiles | undefined;
  layers: readonly NonDeletedLayer[];
  type: typeof EXPORT_DATA_TYPES.excalidrawClipboard;
};

export interface ClipboardData {
  errorMessage?: string;
  files?: BinaryFiles;
  layers?: readonly Layer[];
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
  "toBlob" in HTMLCanvasElement.prototype;

/**
 * Function for determining whether clipboard contains layers
 * @param contents Contents
 */
const clipboardContainsLayers = (
  contents: any
): contents is { files?: BinaryFiles; layers: Layer[] } =>
  !!(
    [
      EXPORT_DATA_TYPES.excalidraw,
      EXPORT_DATA_TYPES.excalidrawClipboard
    ].includes(contents?.type) && Array.isArray(contents.layers)
  );

/**
 * Copies to clipboard
 * @param layers Layers
 * @param files Files
 */
export const copyToClipboard = async (
  layers: readonly NonDeletedLayer[],
  files: BinaryFiles | null
): Promise<string | undefined> => {
  let foundFile = false;

  const binaryFileData = layers.reduce((acc, layer) => {
    if (isInitializedImageLayer(layer)) {
      foundFile = true;

      if (files && files[layer.fileId]) {
        acc[layer.fileId] = files[layer.fileId];
      }
    }

    return acc;
  }, {} as BinaryFiles);

  if (foundFile && !files) {
    devConsole.warn(
      "copyToClipboard: Attempting to file layer(s) without providing associated `files` object."
    );
  }

  // Select binded text layers when copying
  const contents: LayersClipboard = {
    type: EXPORT_DATA_TYPES.excalidrawClipboard,
    layers,
    files: files ? binaryFileData : undefined
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

/**
 * Returns editor clipboard
 */
const getEditorClipboard = (): Partial<LayersClipboard> => {
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

/**
 * Parses potential spreadsheet
 * @param text Text
 */
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
 * Retrieves content from system clipboard (either from `ClipboardEvent`
 * or via async clipboard API if supported)
 * @param event Clipboard event
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
 * Attempts to parse clipboard. Prefers system clipboard
 * @param event Clipboard event
 * @param isPlainPaste Plain paste flag
 */
export const parseClipboard = async (
  event: ClipboardEvent | null,
  isPlainPaste = false
): Promise<ClipboardData> => {
  const systemClipboard = await getSystemClipboard(event);

  // If the system clipboard is empty, couldn't be resolved, or contains a previously
  // copied editor scene as SVG, fallback to previously copied layers
  if (!systemClipboard || !isPlainPaste) {
    return getEditorClipboard();
  }

  // if system clipboard contains spreadsheet, use it even though it's
  // technically possible it's staler than in-editor clipboard
  const spreadsheetResult =
    !isPlainPaste && parsePotentialSpreadsheet(systemClipboard);

  if (spreadsheetResult) {
    return spreadsheetResult;
  }

  const editorClipboardData = getEditorClipboard();

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
  } catch (e) {
    // noop
  }

  // If the system clipboard doesn't contain layers, return plaintext unless
  // we set a flag to prefer the in-editor clipboard, because the browser
  // didn't support storing to the system clipboard on copy
  return PREFER_APP_CLIPBOARD && editorClipboardData.layers
    ? {
        ...editorClipboardData,
        text: isPlainPaste
          ? JSON.stringify(editorClipboardData.layers, null, 2)
          : undefined
      }
    : { text: systemClipboard };
};

/**
 * Copies blob to clipboard as PNG
 * @param blob Blob
 */
export const copyBlobToClipboardAsPng = async (
  blob: Blob | Promise<Blob>
): Promise<void> => {
  try {
    /**
     * In Safari, so far, we have needed to construct the ClipboardItem
     * synchronously (i.e., in the same tick). Otherwise, the browser will
     * complain about the lack of user intent. Using a Promise-based ClipboardItem
     * constructor solves this.
     * @see https://bugs.webkit.org/show_bug.cgi?id=222262
     *
     * Note that Firefox (and potentially others) seem to support the Promise-based
     * ClipboardItem constructor but throw an unrelated MIME type error. Therefore,
     * we need to await this and fallback to awaiting the blob if applicable
     */
    await navigator.clipboard.write([
      new window.ClipboardItem({
        [ImageMime.PNG]: blob
      })
    ]);
  } catch (error: any) {
    // If we're using a Promise ClipboardItem, proceed with constructing
    // with resolution value instead
    if (isPromiseLike(blob)) {
      await navigator.clipboard.write([
        new window.ClipboardItem({
          [ImageMime.PNG]: await blob
        })
      ]);
    } else {
      throw error;
    }
  }
};

/**
 * Copies text to system clipboard
 * @param text Text
 */
export const copyTextToSystemClipboard = async (
  text: string | null
): Promise<void> => {
  let copied = false;

  if (probablySupportsClipboardWriteText) {
    try {
      // Node: Doesn't work on Firefox on non-HTTPS domains, or when the
      // document is not focused
      await navigator.clipboard.writeText(text || "");
      copied = true;
    } catch (error: any) {
      console.error(error);
    }
  }

  // Note that `execCommand` doesn't allow copying empty strings, so if we're
  // clearing clipboard using this API, we must copy at least an empty char
  if (!copied && !copyTextViaExecCommand(text || " ")) {
    throw new Error("Couldn't copy");
  }
};

/**
 * Copies text via exec command
 * @see https://github.com/zenorocha/clipboard.js/blob/ce79f170aa655c408b6aab33c9472e8e4fa52e19/src/clipboard-action.js#L48
 * @param text Text
 */
const copyTextViaExecCommand = (text: string): boolean => {
  const textarea = document.createElement("textarea");

  textarea.style.border = "0";
  textarea.style.padding = "0";
  textarea.style.margin = "0";
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";

  const yPosition = window.pageYOffset || document.documentElement.scrollTop;
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
