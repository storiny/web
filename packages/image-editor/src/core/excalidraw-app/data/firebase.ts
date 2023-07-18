import { decompressData } from "../../../lib/data/encode/encode";
import {
  decryptData,
  encryptData
} from "../../../lib/data/encryption/encryption";
import { restoreLayers } from "../../../lib/data/restore/restore";
import { MIME_TYPES } from "../../constants";
import { getSceneVersion } from "../../layer";
import { ExcalidrawLayer, FileId } from "../../layer/types";
import {
  AppState,
  BinaryFileData,
  BinaryFileMetadata,
  DataURL
} from "../../types";
import { ResolutionType } from "../../utility-types";
import { FILE_CACHE_MAX_AGE_SEC } from "../app_constants";
import Portal from "../collab/Portal";
import { reconcileLayers } from "../collab/reconciliation";
import { getSyncableLayers, SyncableExcalidrawLayer } from ".";

// private
// -----------------------------------------------------------------------------

let FIREBASE_CONFIG: Record<string, any>;
try {
  FIREBASE_CONFIG = JSON.parse(process.env.REACT_APP_FIREBASE_CONFIG);
} catch (error: any) {
  console.warn(
    `Error JSON parsing firebase config. Supplied value: ${process.env.REACT_APP_FIREBASE_CONFIG}`
  );
  FIREBASE_CONFIG = {};
}

let firebasePromise: Promise<typeof import("firebase/app").default> | null =
  null;
let firestorePromise: Promise<any> | null | true = null;
let firebaseStoragePromise: Promise<any> | null | true = null;

let isFirebaseInitialized = false;

const _loadFirebase = async () => {
  const firebase = (
    await import(/* webpackChunkName: "firebase" */ "firebase/app")
  ).default;

  if (!isFirebaseInitialized) {
    try {
      firebase.initializeApp(FIREBASE_CONFIG);
    } catch (error: any) {
      // trying initialize again throws. Usually this is harmless, and happens
      // mainly in dev (HMR)
      if (error.code === "app/duplicate-app") {
        console.warn(error.name, error.code);
      } else {
        throw error;
      }
    }
    isFirebaseInitialized = true;
  }

  return firebase;
};

const _getFirebase = async (): Promise<
  typeof import("firebase/app").default
> => {
  if (!firebasePromise) {
    firebasePromise = _loadFirebase();
  }
  return firebasePromise;
};

// -----------------------------------------------------------------------------

const loadFirestore = async () => {
  const firebase = await _getFirebase();
  if (!firestorePromise) {
    firestorePromise = import(
      /* webpackChunkName: "firestore" */ "firebase/firestore"
    );
  }
  if (firestorePromise !== true) {
    await firestorePromise;
    firestorePromise = true;
  }
  return firebase;
};

export const loadFirebaseStorage = async () => {
  const firebase = await _getFirebase();
  if (!firebaseStoragePromise) {
    firebaseStoragePromise = import(
      /* webpackChunkName: "storage" */ "firebase/storage"
    );
  }
  if (firebaseStoragePromise !== true) {
    await firebaseStoragePromise;
    firebaseStoragePromise = true;
  }
  return firebase;
};

interface FirebaseStoredScene {
  ciphertext: firebase.default.firestore.Blob;
  iv: firebase.default.firestore.Blob;
  sceneVersion: number;
}

const encryptLayers = async (
  key: string,
  layers: readonly ExcalidrawLayer[]
): Promise<{ ciphertext: ArrayBuffer; iv: Uint8Array }> => {
  const json = JSON.stringify(layers);
  const encoded = new TextEncoder().encode(json);
  const { encryptedBuffer, iv } = await encryptData(key, encoded);

  return { ciphertext: encryptedBuffer, iv };
};

const decryptLayers = async (
  data: FirebaseStoredScene,
  roomKey: string
): Promise<readonly ExcalidrawLayer[]> => {
  const ciphertext = data.ciphertext.toUint8Array();
  const iv = data.iv.toUint8Array();

  const decrypted = await decryptData(iv, ciphertext, roomKey);
  const decodedData = new TextDecoder("utf-8").decode(
    new Uint8Array(decrypted)
  );
  return JSON.parse(decodedData);
};

class FirebaseSceneVersionCache {
  private static cache = new WeakMap<SocketIOClient.Socket, number>();
  static get = (socket: SocketIOClient.Socket) =>
    FirebaseSceneVersionCache.cache.get(socket);
  static set = (
    socket: SocketIOClient.Socket,
    layers: readonly SyncableExcalidrawLayer[]
  ) => {
    FirebaseSceneVersionCache.cache.set(socket, getSceneVersion(layers));
  };
}

export const isSavedToFirebase = (
  portal: Portal,
  layers: readonly ExcalidrawLayer[]
): boolean => {
  if (portal.socket && portal.roomId && portal.roomKey) {
    const sceneVersion = getSceneVersion(layers);

    return FirebaseSceneVersionCache.get(portal.socket) === sceneVersion;
  }
  // if no room exists, consider the room saved so that we don't unnecessarily
  // prevent unload (there's nothing we could do at that point anyway)
  return true;
};

export const saveFilesToFirebase = async ({
  prefix,
  files
}: {
  files: { buffer: Uint8Array; id: FileId }[];
  prefix: string;
}) => {
  const firebase = await loadFirebaseStorage();

  const erroredFiles = new Map<FileId, true>();
  const savedFiles = new Map<FileId, true>();

  await Promise.all(
    files.map(async ({ id, buffer }) => {
      try {
        await firebase
          .storage()
          .ref(`${prefix}/${id}`)
          .put(
            new Blob([buffer], {
              type: MIME_TYPES.binary
            }),
            {
              cacheControl: `public, max-age=${FILE_CACHE_MAX_AGE_SEC}`
            }
          );
        savedFiles.set(id, true);
      } catch (error: any) {
        erroredFiles.set(id, true);
      }
    })
  );

  return { savedFiles, erroredFiles };
};

const createFirebaseSceneDocument = async (
  firebase: ResolutionType<typeof loadFirestore>,
  layers: readonly SyncableExcalidrawLayer[],
  roomKey: string
) => {
  const sceneVersion = getSceneVersion(layers);
  const { ciphertext, iv } = await encryptLayers(roomKey, layers);
  return {
    sceneVersion,
    ciphertext: firebase.firestore.Blob.fromUint8Array(
      new Uint8Array(ciphertext)
    ),
    iv: firebase.firestore.Blob.fromUint8Array(iv)
  } as FirebaseStoredScene;
};

export const saveToFirebase = async (
  portal: Portal,
  layers: readonly SyncableExcalidrawLayer[],
  editorState: AppState
) => {
  const { roomId, roomKey, socket } = portal;
  if (
    // bail if no room exists as there's nothing we can do at this point
    !roomId ||
    !roomKey ||
    !socket ||
    isSavedToFirebase(portal, layers)
  ) {
    return false;
  }

  const firebase = await loadFirestore();
  const firestore = firebase.firestore();

  const docRef = firestore.collection("scenes").doc(roomId);

  const savedData = await firestore.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(docRef);

    if (!snapshot.exists) {
      const sceneDocument = await createFirebaseSceneDocument(
        firebase,
        layers,
        roomKey
      );

      transaction.set(docRef, sceneDocument);

      return {
        layers,
        reconciledLayers: null
      };
    }

    const prevDocData = snapshot.data() as FirebaseStoredScene;
    const prevLayers = getSyncableLayers(
      await decryptLayers(prevDocData, roomKey)
    );

    const reconciledLayers = getSyncableLayers(
      reconcileLayers(layers, prevLayers, editorState)
    );

    const sceneDocument = await createFirebaseSceneDocument(
      firebase,
      reconciledLayers,
      roomKey
    );

    transaction.update(docRef, sceneDocument);
    return {
      layers,
      reconciledLayers
    };
  });

  FirebaseSceneVersionCache.set(socket, savedData.layers);

  return { reconciledLayers: savedData.reconciledLayers };
};

export const loadFromFirebase = async (
  roomId: string,
  roomKey: string,
  socket: SocketIOClient.Socket | null
): Promise<readonly ExcalidrawLayer[] | null> => {
  const firebase = await loadFirestore();
  const db = firebase.firestore();

  const docRef = db.collection("scenes").doc(roomId);
  const doc = await docRef.get();
  if (!doc.exists) {
    return null;
  }
  const storedScene = doc.data() as FirebaseStoredScene;
  const layers = getSyncableLayers(await decryptLayers(storedScene, roomKey));

  if (socket) {
    FirebaseSceneVersionCache.set(socket, layers);
  }

  return restoreLayers(layers, null);
};

export const loadFilesFromFirebase = async (
  prefix: string,
  decryptionKey: string,
  filesIds: readonly FileId[]
) => {
  const loadedFiles: BinaryFileData[] = [];
  const erroredFiles = new Map<FileId, true>();

  await Promise.all(
    [...new Set(filesIds)].map(async (id) => {
      try {
        const url = `https://firebasestorage.googleapis.com/v0/b/${
          FIREBASE_CONFIG.storageBucket
        }/o/${encodeURIComponent(prefix.replace(/^\//, ""))}%2F${id}`;
        const response = await fetch(`${url}?alt=media`);
        if (response.status < 400) {
          const arrayBuffer = await response.arrayBuffer();

          const { data, metadata } = await decompressData<BinaryFileMetadata>(
            new Uint8Array(arrayBuffer),
            {
              decryptionKey
            }
          );

          const dataURL = new TextDecoder().decode(data) as DataURL;

          loadedFiles.push({
            mimeType: metadata.mimeType || MIME_TYPES.binary,
            id,
            dataURL,
            created: metadata?.created || Date.now(),
            lastRetrieved: metadata?.created || Date.now()
          });
        } else {
          erroredFiles.set(id, true);
        }
      } catch (error: any) {
        erroredFiles.set(id, true);
        console.error(error);
      }
    })
  );

  return { loadedFiles, erroredFiles };
};
