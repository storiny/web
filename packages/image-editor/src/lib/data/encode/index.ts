import { devConsole } from "@storiny/shared/src/utils/devLog";
import { deflate, inflate } from "pako";

import { decryptData, encryptData } from "../encryption/encryption";

// Byte (binary) strings

/**
 * Converts a data array to byte string
 * @param data Data
 */
export const toByteString = (
  data: string | Uint8Array | ArrayBuffer
): Promise<string> =>
  new Promise((resolve, reject) => {
    const blob =
      typeof data === "string"
        ? new Blob([new TextEncoder().encode(data)])
        : new Blob([data instanceof Uint8Array ? data : new Uint8Array(data)]);
    const reader = new FileReader();

    reader.onload = (event): void => {
      if (!event.target || typeof event.target.result !== "string") {
        return reject(new Error("Unable to convert to byte string"));
      }
      resolve(event.target.result);
    };

    reader.readAsBinaryString(blob);
  });

/**
 * Converts byte string to array buffer
 * @param byteString Byte string
 */
const byteStringToArrayBuffer = (byteString: string): ArrayBuffer => {
  const buffer = new ArrayBuffer(byteString.length);
  const bufferView = new Uint8Array(buffer);

  for (let i = 0, len = byteString.length; i < len; i++) {
    bufferView[i] = byteString.charCodeAt(i);
  }

  return buffer;
};

/**
 * Converts byte string to string
 * @param byteString Byte string
 */
const byteStringToString = (byteString: string): string =>
  new TextDecoder("utf-8").decode(byteStringToArrayBuffer(byteString));

// Base64

/**
 * Converts string to base64
 * @param str Input string
 * @param isByteString If `true`, skips re-encoding to byte string
 */
export const stringToBase64 = async (
  str: string,
  isByteString = false
): Promise<string> =>
  isByteString ? window.btoa(str) : window.btoa(await toByteString(str));

/**
 * Converts base64 to string
 *
 * This function is async to align with `stringToBase64`
 * @param base64 Base64 string
 * @param isByteString  If `true`, skips deencoding byte string to string
 */
export const base64ToString = async (
  base64: string,
  isByteString = false
): Promise<string> =>
  isByteString ? window.atob(base64) : byteStringToString(window.atob(base64));

// Text encoding

interface EncodedData {
  // Whether text is compressed (zlib)
  compressed: boolean;
  encoded: string;
  encoding: "bstring";
  // Version for potential migration purposes
  version?: string;
}

/**
 * Encodes (and potentially compresses via zlib) text to byte string
 * @param text Input text
 * @param compress Whether to enable compression
 */
export const encode = async ({
  text,
  compress = true
}: {
  compress?: boolean;
  text: string;
}): Promise<EncodedData> => {
  let deflated!: string;

  if (compress) {
    try {
      deflated = await toByteString(deflate(text));
    } catch (error: any) {
      devConsole.error("ENCODE: cannot deflate", error);
    }
  }

  return {
    version: "1",
    encoding: "bstring",
    compressed: !!deflated,
    encoded: deflated || (await toByteString(text))
  };
};

/**
 * Decodes byte string to text
 * @param data Byte string
 */
export const decode = async (data: EncodedData): Promise<string> => {
  let decoded: string;

  switch (data.encoding) {
    case "bstring":
      // If compressed, do not double decode the bstring
      decoded = data.compressed
        ? data.encoded
        : byteStringToString(data.encoded);
      break;
    default:
      throw new Error(`DECODE: unknown encoding "${data.encoding}"`);
  }

  if (data.compressed) {
    return inflate(new Uint8Array(byteStringToArrayBuffer(decoded)), {
      to: "string"
    });
  }

  return decoded;
};

// Bindary encoding

interface FileEncodingInfo {
  compression: "pako@1" | null;
  encryption: "AES-GCM" | null;
}

/**
 * Corresponds to DataView setter methods (setUint32, setUint16, etc.)
 *
 * Values must not be changed as these are backwards incompatible
 */
const CONCAT_BUFFERS_VERSION = 1;
const VERSION_DATAVIEW_BYTES = 4;
const NEXT_CHUNK_SIZE_DATAVIEW_BYTES = 4;

const DATA_VIEW_BITS_MAP = { 1: 8, 2: 16, 4: 32 } as const;

// Getter
function dataView(buffer: Uint8Array, bytes: 1 | 2 | 4, offset: number): number;
// Setter
// eslint-disable-next-line no-redeclare
function dataView(
  buffer: Uint8Array,
  bytes: 1 | 2 | 4,
  offset: number,
  value: number
): Uint8Array;
/**
 * Abstraction over DataView that serves as a typed getter/setter in case
 * we're using constants for the byte size and want to ensure there's no
 * discrepenancy in the encoding across refactors.
 *
 * DataView serves for an endian-agnostic handling of numbers in ArrayBuffers.
 */
// eslint-disable-next-line no-redeclare,prefer-arrow-functions/prefer-arrow-functions
function dataView(
  buffer: Uint8Array,
  bytes: 1 | 2 | 4,
  offset: number,
  value?: number
): Uint8Array | number {
  if (value != null) {
    if (value > Math.pow(2, DATA_VIEW_BITS_MAP[bytes]) - 1) {
      throw new Error(
        `Attempting to set value higher than the allocated bytes (value: ${value}, bytes: ${bytes})`
      );
    }

    const method = `setUint${DATA_VIEW_BITS_MAP[bytes]}` as const;
    new DataView(buffer.buffer)[method](offset, value);
    return buffer;
  }

  const method = `getUint${DATA_VIEW_BITS_MAP[bytes]}` as const;
  return new DataView(buffer.buffer)[method](offset);
}

/**
 * Concats buffer arrays
 *
 * The Resulting concatenated buffer has this format:
 *
 * [
 *   VERSION chunk (4 bytes)
 *   LENGTH chunk 1 (4 bytes)
 *   DATA chunk 1 (up to 2^32 bits)
 *   LENGTH chunk 2 (4 bytes)
 *   DATA chunk 2 (up to 2^32 bits)
 *   ...
 * ]
 *
 * @param buffers Each buffer (chunk) must be at most 2^32 bits large (~4GB)
 */
const concatBuffers = (...buffers: Uint8Array[]): Uint8Array => {
  const bufferView = new Uint8Array(
    VERSION_DATAVIEW_BYTES +
      NEXT_CHUNK_SIZE_DATAVIEW_BYTES * buffers.length +
      buffers.reduce((acc, buffer) => acc + buffer.byteLength, 0)
  );

  let cursor = 0;

  // As the first chunk, we'll encode the version for backwards compatibility
  dataView(bufferView, VERSION_DATAVIEW_BYTES, cursor, CONCAT_BUFFERS_VERSION);
  cursor += VERSION_DATAVIEW_BYTES;

  for (const buffer of buffers) {
    dataView(
      bufferView,
      NEXT_CHUNK_SIZE_DATAVIEW_BYTES,
      cursor,
      buffer.byteLength
    );

    cursor += NEXT_CHUNK_SIZE_DATAVIEW_BYTES;
    bufferView.set(buffer, cursor);
    cursor += buffer.byteLength;
  }

  return bufferView;
};

/**
 * Splits buffers generated using `concatBuffers`
 * @param concatenatedBuffer Concatenated buffers
 */
const splitBuffers = (concatenatedBuffer: Uint8Array): Uint8Array[] => {
  const buffers: Uint8Array[] = [];
  let cursor = 0;

  // The First chunk is the version
  const version = dataView(
    concatenatedBuffer,
    NEXT_CHUNK_SIZE_DATAVIEW_BYTES,
    cursor
  );

  // If the version is outside the supported versions, throw an error.
  // This usually means the buffer wasn't encoded using this API, so we'd only
  // waste compute.
  if (version > CONCAT_BUFFERS_VERSION) {
    throw new Error(`Invalid version ${version}`);
  }

  cursor += VERSION_DATAVIEW_BYTES;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const chunkSize = dataView(
      concatenatedBuffer,
      NEXT_CHUNK_SIZE_DATAVIEW_BYTES,
      cursor
    );

    cursor += NEXT_CHUNK_SIZE_DATAVIEW_BYTES;
    buffers.push(concatenatedBuffer.slice(cursor, cursor + chunkSize));
    cursor += chunkSize;

    if (cursor >= concatenatedBuffer.byteLength) {
      break;
    }
  }

  return buffers;
};

/**
 * Encrypts and compresses data array
 * @param data Data array
 * @param encryptionKey Encryption key
 * @private
 */
const encryptAndCompress = async (
  data: Uint8Array | string,
  encryptionKey: string
): Promise<{ buffer: Uint8Array; iv: Uint8Array }> => {
  const { encryptedBuffer, iv } = await encryptData(
    encryptionKey,
    deflate(data)
  );

  return { iv, buffer: new Uint8Array(encryptedBuffer) };
};

/**
 * Compresses a data array
 *
 * The returned buffer has the following format:
 * `[]` refers to a buffer wrapper (from `concatBuffers`)
 *
 * [
 *   encodingMetadataBuffer,
 *   iv,
 *   [
 *      contentsMetadataBuffer
 *      contentsBuffer
 *   ]
 * ]
 * @param dataBuffer Data buffer
 * @param options Compression options
 */
export const compressData = async <T extends Record<string, any> = never>(
  dataBuffer: Uint8Array,
  options: {
    encryptionKey: string;
  } & ([T] extends [never]
    ? {
        metadata?: T;
      }
    : {
        metadata: T;
      })
): Promise<Uint8Array> => {
  const fileInfo: FileEncodingInfo = {
    compression: "pako@1",
    encryption: "AES-GCM"
  };

  const encodingMetadataBuffer = new TextEncoder().encode(
    JSON.stringify(fileInfo)
  );
  const contentsMetadataBuffer = new TextEncoder().encode(
    JSON.stringify(options.metadata || null)
  );
  const { iv, buffer } = await encryptAndCompress(
    concatBuffers(contentsMetadataBuffer, dataBuffer),
    options.encryptionKey
  );

  return concatBuffers(encodingMetadataBuffer, iv, buffer);
};

/**
 * Decrypts and decompresses data
 * @param iv Init vector
 * @param decryptedBuffer Decrypted buffer array
 * @param decryptionKey Decryption key
 * @param isCompressed Compression flag
 * @private
 */
const decryptAndDecompress = async (
  iv: Uint8Array,
  decryptedBuffer: Uint8Array,
  decryptionKey: string,
  isCompressed: boolean
): Promise<Uint8Array> => {
  decryptedBuffer = new Uint8Array(
    await decryptData(iv, decryptedBuffer, decryptionKey)
  );

  if (isCompressed) {
    return inflate(decryptedBuffer);
  }

  return decryptedBuffer;
};

/**
 * Decompresses data
 * @param bufferView Buffer data
 * @param options Decompression options
 */
export const decompressData = async <T extends Record<string, any>>(
  bufferView: Uint8Array,
  options: { decryptionKey: string }
): Promise<{ data: Uint8Array; metadata: T }> => {
  // The first chunk is encoding metadata (ignored for now)
  const [encodingMetadataBuffer, iv, buffer] = splitBuffers(bufferView);
  const encodingMetadata: FileEncodingInfo = JSON.parse(
    new TextDecoder().decode(encodingMetadataBuffer)
  );

  try {
    const [contentsMetadataBuffer, contentsBuffer] = splitBuffers(
      await decryptAndDecompress(
        iv,
        buffer,
        options.decryptionKey,
        !!encodingMetadata.compression
      )
    );
    const metadata = JSON.parse(
      new TextDecoder().decode(contentsMetadataBuffer)
    ) as T;

    return {
      // Metadata source is always JSON, so we can decode it here
      metadata,
      // Data can be anything so that called must decode it
      data: contentsBuffer
    };
  } catch (error: any) {
    devConsole.error(
      `Error during decompressing and decrypting the file`,
      encodingMetadata
    );

    throw error;
  }
};
