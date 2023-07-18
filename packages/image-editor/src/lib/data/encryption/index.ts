import { ENCRYPTION_KEY_BITS } from "../../../constants/new";
import { blobToArrayBuffer } from "../blob";

export const IV_LENGTH_BYTES = 12;

/**
 * Creates init vector
 */
export const createIV = (): Uint8Array =>
  window.crypto.getRandomValues(new Uint8Array(IV_LENGTH_BYTES));

/**
 * Generates a new encryption key
 * @param returnAs Key return type
 */
export const generateEncryptionKey = async <
  T extends "string" | "cryptoKey" = "string"
>(
  returnAs?: T
): Promise<T extends "cryptoKey" ? CryptoKey : string> => {
  const key = await window.crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: ENCRYPTION_KEY_BITS
    },
    true, // Extractable
    ["encrypt", "decrypt"]
  );

  return (
    returnAs === "cryptoKey"
      ? key
      : (await window.crypto.subtle.exportKey("jwk", key)).k
  ) as T extends "cryptoKey" ? CryptoKey : string;
};

/**
 * Returns a crypto key
 * @param key Key
 * @param usage Key usage
 */
export const getCryptoKey = (
  key: string,
  usage:
    | "decrypt"
    | "deriveBits"
    | "deriveKey"
    | "encrypt"
    | "sign"
    | "unwrapKey"
    | "verify"
    | "wrapKey"
): Promise<CryptoKey> =>
  window.crypto.subtle.importKey(
    "jwk",
    {
      alg: "A128GCM",
      ext: true,
      k: key,
      key_ops: ["encrypt", "decrypt"],
      kty: "oct"
    },
    {
      name: "AES-GCM",
      length: ENCRYPTION_KEY_BITS
    },
    false, // Extractable
    [usage]
  );

/**
 * Encrypts data
 * @param key Encryption key
 * @param data Data to encrypt
 */
export const encryptData = async (
  key: string | CryptoKey,
  data: Uint8Array | ArrayBuffer | Blob | File | string
): Promise<{ encryptedBuffer: ArrayBuffer; iv: Uint8Array }> => {
  const importedKey =
    typeof key === "string" ? await getCryptoKey(key, "encrypt") : key;
  const iv = createIV();
  const buffer: ArrayBuffer | Uint8Array =
    typeof data === "string"
      ? new TextEncoder().encode(data)
      : data instanceof Uint8Array
      ? data
      : data instanceof Blob
      ? await blobToArrayBuffer(data)
      : data;

  // We use symmetric encryption. AES-GCM is the recommended algorithm and
  // includes checks that the ciphertext has not been modified by an attacker
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv
    },
    importedKey,
    buffer as ArrayBuffer | Uint8Array
  );

  return { encryptedBuffer, iv };
};

/**
 * Decrypts data
 * @param iv Init vector
 * @param encrypted Encrypted data
 * @param privateKey Key
 */
export const decryptData = async (
  iv: Uint8Array,
  encrypted: Uint8Array | ArrayBuffer,
  privateKey: string
): Promise<ArrayBuffer> =>
  window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv
    },
    await getCryptoKey(privateKey, "decrypt"),
    encrypted
  );
