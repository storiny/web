import { atom, useAtom } from "jotai";
import throttle from "lodash.throttle";
import { PureComponent } from "react";

import { ErrorDialog } from "../../../components/core/ErrorDialog";
import { decryptData } from "../../../lib/data/encryption/encryption";
import { ImportedDataState } from "../../../lib/data/types";
import { AbortError } from "../../../lib/errors/errors";
import {
  getSceneVersion,
  restoreLayers
} from "../../../lib/packages/excalidraw/index";
import {
  preventUnload,
  resolvablePromise,
  withBatchedUpdates
} from "../../../lib/utils/utils";
import { APP_NAME, ENV, EVENT } from "../../constants";
import { ACTIVE_THRESHOLD, IDLE_THRESHOLD } from "../../constants";
import { t } from "../../i18n";
import { newLayerWith } from "../../layer/mutateLayer";
import { isImageLayer, isInitializedImageLayer } from "../../layer/typeChecks";
import {
  ExcalidrawLayer,
  InitializedExcalidrawImageLayer
} from "../../layer/types";
import { ExcalidrawImperativeAPI } from "../../types";
import { Collaborator, Gesture } from "../../types";
import { UserIdleState } from "../../types";
import {
  CURSOR_SYNC_TIMEOUT,
  FILE_UPLOAD_MAX_BYTES,
  FIREBASE_STORAGE_PREFIXES,
  INITIAL_SCENE_UPDATE_TIMEOUT,
  LOAD_IMAGES_TIMEOUT,
  SYNC_FULL_SCENE_INTERVAL_MS,
  WS_SCENE_EVENT_TYPES
} from "../app_constants";
import { appJotaiStore } from "../app-jotai";
import {
  generateCollaborationLinkData,
  getCollaborationLink,
  getCollabServer,
  getSyncableLayers,
  SocketUpdateDataSource,
  SyncableExcalidrawLayer
} from "../data";
import {
  encodeFilesForUpload,
  FileManager,
  updateStaleImageStatuses
} from "../data/FileManager";
import {
  isSavedToFirebase,
  loadFilesFromFirebase,
  loadFromFirebase,
  saveFilesToFirebase,
  saveToFirebase
} from "../data/firebase";
import { LocalData } from "../data/LocalData";
import {
  importUsernameFromLocalStorage,
  saveUsernameToLocalStorage
} from "../data/localStorage";
import { resetBrowserStateVersions } from "../data/tabSync";
import Portal from "./Portal";
import {
  ReconciledLayers,
  reconcileLayers as _reconcileLayers
} from "./reconciliation";
import RoomDialog from "./RoomDialog";

export const collabAPIAtom = atom<CollabAPI | null>(null);
export const collabDialogShownAtom = atom(false);
export const isCollaboratingAtom = atom(false);
export const isOfflineAtom = atom(false);

interface CollabState {
  activeRoomLink: string;
  errorMessage: string;
  username: string;
}

type CollabInstance = InstanceType<typeof Collab>;

export interface CollabAPI {
  fetchImageFilesFromFirebase: CollabInstance["fetchImageFilesFromFirebase"];
  /** function so that we can access the latest value from stale callbacks */
  isCollaborating: () => boolean;
  onPointerUpdate: CollabInstance["onPointerUpdate"];
  setUsername: (username: string) => void;
  startCollaboration: CollabInstance["startCollaboration"];
  stopCollaboration: CollabInstance["stopCollaboration"];
  syncLayers: CollabInstance["syncLayers"];
}

interface PublicProps {
  excalidrawAPI: ExcalidrawImperativeAPI;
}

type Props = PublicProps & { modalIsShown: boolean };

class Collab extends PureComponent<Props, CollabState> {
  portal: Portal;
  fileManager: FileManager;
  excalidrawAPI: Props["excalidrawAPI"];
  activeIntervalId: number | null;
  idleTimeoutId: number | null;

  private socketInitializationTimer?: number;
  private lastBroadcastedOrReceivedSceneVersion: number = -1;
  private collaborators = new Map<string, Collaborator>();

  constructor(props: Props) {
    super(props);
    this.state = {
      errorMessage: "",
      username: importUsernameFromLocalStorage() || "",
      activeRoomLink: ""
    };
    this.portal = new Portal(this);
    this.fileManager = new FileManager({
      getFiles: async (fileIds) => {
        const { roomId, roomKey } = this.portal;
        if (!roomId || !roomKey) {
          throw new AbortError();
        }

        return loadFilesFromFirebase(`files/rooms/${roomId}`, roomKey, fileIds);
      },
      saveFiles: async ({ addedFiles }) => {
        const { roomId, roomKey } = this.portal;
        if (!roomId || !roomKey) {
          throw new AbortError();
        }

        return saveFilesToFirebase({
          prefix: `${FIREBASE_STORAGE_PREFIXES.collabFiles}/${roomId}`,
          files: await encodeFilesForUpload({
            files: addedFiles,
            encryptionKey: roomKey,
            maxBytes: FILE_UPLOAD_MAX_BYTES
          })
        });
      }
    });
    this.excalidrawAPI = props.excalidrawAPI;
    this.activeIntervalId = null;
    this.idleTimeoutId = null;
  }

  componentDidMount() {
    window.addEventListener(EVENT.BEFORE_UNLOAD, this.beforeUnload);
    window.addEventListener("online", this.onOfflineStatusToggle);
    window.addEventListener("offline", this.onOfflineStatusToggle);
    window.addEventListener(EVENT.UNLOAD, this.onUnload);

    this.onOfflineStatusToggle();

    const collabAPI: CollabAPI = {
      isCollaborating: this.isCollaborating,
      onPointerUpdate: this.onPointerUpdate,
      startCollaboration: this.startCollaboration,
      syncLayers: this.syncLayers,
      fetchImageFilesFromFirebase: this.fetchImageFilesFromFirebase,
      stopCollaboration: this.stopCollaboration,
      setUsername: this.setUsername
    };

    appJotaiStore.set(collabAPIAtom, collabAPI);

    if (
      process.env.NODE_ENV === ENV.TEST ||
      process.env.NODE_ENV === ENV.DEVELOPMENT
    ) {
      window.collab = window.collab || ({} as Window["collab"]);
      Object.defineProperties(window, {
        collab: {
          configurable: true,
          value: this
        }
      });
    }
  }

  onOfflineStatusToggle = () => {
    appJotaiStore.set(isOfflineAtom, !window.navigator.onLine);
  };

  componentWillUnmount() {
    window.removeEventListener("online", this.onOfflineStatusToggle);
    window.removeEventListener("offline", this.onOfflineStatusToggle);
    window.removeEventListener(EVENT.BEFORE_UNLOAD, this.beforeUnload);
    window.removeEventListener(EVENT.UNLOAD, this.onUnload);
    window.removeEventListener(EVENT.POINTER_MOVE, this.onPointerMove);
    window.removeEventListener(
      EVENT.VISIBILITY_CHANGE,
      this.onVisibilityChange
    );
    if (this.activeIntervalId) {
      window.clearInterval(this.activeIntervalId);
      this.activeIntervalId = null;
    }
    if (this.idleTimeoutId) {
      window.clearTimeout(this.idleTimeoutId);
      this.idleTimeoutId = null;
    }
  }

  isCollaborating = () => appJotaiStore.get(isCollaboratingAtom)!;

  private setIsCollaborating = (isCollaborating: boolean) => {
    appJotaiStore.set(isCollaboratingAtom, isCollaborating);
  };

  private onUnload = () => {
    this.destroySocketClient({ isUnload: true });
  };

  private beforeUnload = withBatchedUpdates((event: BeforeUnloadEvent) => {
    const syncableLayers = getSyncableLayers(
      this.getSceneLayersIncludingDeleted()
    );

    if (
      this.isCollaborating() &&
      (this.fileManager.shouldPreventUnload(syncableLayers) ||
        !isSavedToFirebase(this.portal, syncableLayers))
    ) {
      // this won't run in time if user decides to leave the site, but
      //  the purpose is to run in immediately after user decides to stay
      this.saveCollabRoomToFirebase(syncableLayers);

      preventUnload(event);
    }
  });

  saveCollabRoomToFirebase = async (
    syncableLayers: readonly SyncableExcalidrawLayer[]
  ) => {
    try {
      const savedData = await saveToFirebase(
        this.portal,
        syncableLayers,
        this.excalidrawAPI.getAppState()
      );

      if (this.isCollaborating() && savedData && savedData.reconciledLayers) {
        this.handleRemoteSceneUpdate(
          this.reconcileLayers(savedData.reconciledLayers)
        );
      }
    } catch (error: any) {
      this.setState({
        // firestore doesn't return a specific error code when size exceeded
        errorMessage: /is longer than.*?bytes/.test(error.message)
          ? t("errors.collabSaveFailed_sizeExceeded")
          : t("errors.collabSaveFailed")
      });
      console.error(error);
    }
  };

  stopCollaboration = (keepRemoteState = true) => {
    this.queueBroadcastAllLayers.cancel();
    this.queueSaveToFirebase.cancel();
    this.loadImageFiles.cancel();

    this.saveCollabRoomToFirebase(
      getSyncableLayers(this.excalidrawAPI.getSceneLayersIncludingDeleted())
    );

    if (this.portal.socket && this.fallbackInitializationHandler) {
      this.portal.socket.off(
        "connect_error",
        this.fallbackInitializationHandler
      );
    }

    if (!keepRemoteState) {
      LocalData.fileStorage.reset();
      this.destroySocketClient();
    } else if (window.confirm(t("alerts.collabStopOverridePrompt"))) {
      // hack to ensure that we prefer we disregard any new browser state
      // that could have been saved in other tabs while we were collaborating
      resetBrowserStateVersions();

      window.history.pushState({}, APP_NAME, window.location.origin);
      this.destroySocketClient();

      LocalData.fileStorage.reset();

      const layers = this.excalidrawAPI
        .getSceneLayersIncludingDeleted()
        .map((layer) => {
          if (isImageLayer(layer) && layer.status === "saved") {
            return newLayerWith(layer, { status: "pending" });
          }
          return layer;
        });

      this.excalidrawAPI.updateScene({
        layers,
        commitToHistory: false
      });
    }
  };

  private destroySocketClient = (opts?: { isUnload: boolean }) => {
    this.lastBroadcastedOrReceivedSceneVersion = -1;
    this.portal.close();
    this.fileManager.reset();
    if (!opts?.isUnload) {
      this.setIsCollaborating(false);
      this.setState({
        activeRoomLink: ""
      });
      this.collaborators = new Map();
      this.excalidrawAPI.updateScene({
        collaborators: this.collaborators
      });
      LocalData.resumeSave("collaboration");
    }
  };

  private fetchImageFilesFromFirebase = async (opts: {
    /**
     * Indicates whether to fetch files that are errored or pending and older
     * than 10 seconds.
     *
     * Use this as a machanism to fetch files which may be ok but for some
     * reason their status was not updated correctly.
     */
    forceFetchFiles?: boolean;
    layers: readonly ExcalidrawLayer[];
  }) => {
    const unfetchedImages = opts.layers
      .filter((layer) => {
        return (
          isInitializedImageLayer(layer) &&
          !this.fileManager.isFileHandled(layer.fileId) &&
          !layer.isDeleted &&
          (opts.forceFetchFiles
            ? layer.status !== "pending" || Date.now() - layer.updated > 10000
            : layer.status === "saved")
        );
      })
      .map((layer) => (layer as InitializedExcalidrawImageLayer).fileId);

    return await this.fileManager.getFiles(unfetchedImages);
  };

  private decryptPayload = async (
    iv: Uint8Array,
    encryptedData: ArrayBuffer,
    decryptionKey: string
  ) => {
    try {
      const decrypted = await decryptData(iv, encryptedData, decryptionKey);

      const decodedData = new TextDecoder("utf-8").decode(
        new Uint8Array(decrypted)
      );
      return JSON.parse(decodedData);
    } catch (error) {
      window.alert(t("alerts.decryptFailed"));
      console.error(error);
      return {
        type: "INVALID_RESPONSE"
      };
    }
  };

  private fallbackInitializationHandler: null | (() => any) = null;

  startCollaboration = async (
    existingRoomLinkData: null | { roomId: string; roomKey: string }
  ): Promise<ImportedDataState | null> => {
    if (!this.state.username) {
      import("@excalidraw/random-username").then(({ getRandomUsername }) => {
        const username = getRandomUsername();
        this.onUsernameChange(username);
      });
    }

    if (this.portal.socket) {
      return null;
    }

    let roomId;
    let roomKey;

    if (existingRoomLinkData) {
      ({ roomId, roomKey } = existingRoomLinkData);
    } else {
      ({ roomId, roomKey } = await generateCollaborationLinkData());
      window.history.pushState(
        {},
        APP_NAME,
        getCollaborationLink({ roomId, roomKey })
      );
    }

    const scenePromise = resolvablePromise<ImportedDataState | null>();

    this.setIsCollaborating(true);
    LocalData.pauseSave("collaboration");

    const { default: socketIOClient } = await import(
      /* webpackChunkName: "socketIoClient" */ "socket.io-client"
    );

    const fallbackInitializationHandler = () => {
      this.initializeRoom({
        roomLinkData: existingRoomLinkData,
        fetchScene: true
      }).then((scene) => {
        scenePromise.resolve(scene);
      });
    };
    this.fallbackInitializationHandler = fallbackInitializationHandler;

    try {
      const socketServerData = await getCollabServer();

      this.portal.socket = this.portal.open(
        socketIOClient(socketServerData.url, {
          transports: socketServerData.polling
            ? ["websocket", "polling"]
            : ["websocket"]
        }),
        roomId,
        roomKey
      );

      this.portal.socket.once("connect_error", fallbackInitializationHandler);
    } catch (error: any) {
      console.error(error);
      this.setState({ errorMessage: error.message });
      return null;
    }

    if (!existingRoomLinkData) {
      const layers = this.excalidrawAPI.getSceneLayers().map((layer) => {
        if (isImageLayer(layer) && layer.status === "saved") {
          return newLayerWith(layer, { status: "pending" });
        }
        return layer;
      });
      // remove deleted layers from layers array & history to ensure we don't
      // expose potentially sensitive user data in case user manually deletes
      // existing layers (or clears scene), which would otherwise be persisted
      // to database even if deleted before creating the room.
      this.excalidrawAPI.history.clear();
      this.excalidrawAPI.updateScene({
        layers,
        commitToHistory: true
      });

      this.saveCollabRoomToFirebase(getSyncableLayers(layers));
    }

    // fallback in case you're not alone in the room but still don't receive
    // initial SCENE_INIT message
    this.socketInitializationTimer = window.setTimeout(
      fallbackInitializationHandler,
      INITIAL_SCENE_UPDATE_TIMEOUT
    );

    // All socket listeners are moving to Portal
    this.portal.socket.on(
      "client-broadcast",
      async (encryptedData: ArrayBuffer, iv: Uint8Array) => {
        if (!this.portal.roomKey) {
          return;
        }

        const decryptedData = await this.decryptPayload(
          iv,
          encryptedData,
          this.portal.roomKey
        );

        switch (decryptedData.type) {
          case "INVALID_RESPONSE":
            return;
          case WS_SCENE_EVENT_TYPES.INIT: {
            if (!this.portal.socketInitialized) {
              this.initializeRoom({ fetchScene: false });
              const remoteLayers = decryptedData.payload.layers;
              const reconciledLayers = this.reconcileLayers(remoteLayers);
              this.handleRemoteSceneUpdate(reconciledLayers, {
                init: true
              });
              // noop if already resolved via init from firebase
              scenePromise.resolve({
                layers: reconciledLayers,
                scrollToContent: true
              });
            }
            break;
          }
          case WS_SCENE_EVENT_TYPES.UPDATE:
            this.handleRemoteSceneUpdate(
              this.reconcileLayers(decryptedData.payload.layers)
            );
            break;
          case "MOUSE_LOCATION": {
            const { pointer, button, username, selectedLayerIds } =
              decryptedData.payload;
            const socketId: SocketUpdateDataSource["MOUSE_LOCATION"]["payload"]["socketId"] =
              decryptedData.payload.socketId ||
              // @ts-ignore legacy, see #2094 (#2097)
              decryptedData.payload.socketID;

            const collaborators = new Map(this.collaborators);
            const user = collaborators.get(socketId) || {}!;
            user.pointer = pointer;
            user.button = button;
            user.selectedLayerIds = selectedLayerIds;
            user.username = username;
            collaborators.set(socketId, user);
            this.excalidrawAPI.updateScene({
              collaborators
            });
            break;
          }
          case "IDLE_STATUS": {
            const { userState, socketId, username } = decryptedData.payload;
            const collaborators = new Map(this.collaborators);
            const user = collaborators.get(socketId) || {}!;
            user.userState = userState;
            user.username = username;
            this.excalidrawAPI.updateScene({
              collaborators
            });
            break;
          }
        }
      }
    );

    this.portal.socket.on("first-in-room", async () => {
      if (this.portal.socket) {
        this.portal.socket.off("first-in-room");
      }
      const sceneData = await this.initializeRoom({
        fetchScene: true,
        roomLinkData: existingRoomLinkData
      });
      scenePromise.resolve(sceneData);
    });

    this.initializeIdleDetector();

    this.setState({
      activeRoomLink: window.location.href
    });

    return scenePromise;
  };

  private initializeRoom = async ({
    fetchScene,
    roomLinkData
  }:
    | {
        fetchScene: true;
        roomLinkData: { roomId: string; roomKey: string } | null;
      }
    | { fetchScene: false; roomLinkData?: null }) => {
    clearTimeout(this.socketInitializationTimer!);
    if (this.portal.socket && this.fallbackInitializationHandler) {
      this.portal.socket.off(
        "connect_error",
        this.fallbackInitializationHandler
      );
    }
    if (fetchScene && roomLinkData && this.portal.socket) {
      this.excalidrawAPI.resetScene();

      try {
        const layers = await loadFromFirebase(
          roomLinkData.roomId,
          roomLinkData.roomKey,
          this.portal.socket
        );
        if (layers) {
          this.setLastBroadcastedOrReceivedSceneVersion(
            getSceneVersion(layers)
          );

          return {
            layers,
            scrollToContent: true
          };
        }
      } catch (error: any) {
        // log the error and move on. other peers will sync us the scene.
        console.error(error);
      } finally {
        this.portal.socketInitialized = true;
      }
    } else {
      this.portal.socketInitialized = true;
    }
    return null;
  };

  private reconcileLayers = (
    remoteLayers: readonly ExcalidrawLayer[]
  ): ReconciledLayers => {
    const localLayers = this.getSceneLayersIncludingDeleted();
    const editorState = this.excalidrawAPI.getAppState();

    remoteLayers = restoreLayers(remoteLayers, null);

    const reconciledLayers = _reconcileLayers(
      localLayers,
      remoteLayers,
      editorState
    );

    // Avoid broadcasting to the rest of the collaborators the scene
    // we just received!
    // Note: this needs to be set before updating the scene as it
    // synchronously calls render.
    this.setLastBroadcastedOrReceivedSceneVersion(
      getSceneVersion(reconciledLayers)
    );

    return reconciledLayers;
  };

  private loadImageFiles = throttle(async () => {
    const { loadedFiles, erroredFiles } =
      await this.fetchImageFilesFromFirebase({
        layers: this.excalidrawAPI.getSceneLayersIncludingDeleted()
      });

    this.excalidrawAPI.addFiles(loadedFiles);

    updateStaleImageStatuses({
      excalidrawAPI: this.excalidrawAPI,
      erroredFiles,
      layers: this.excalidrawAPI.getSceneLayersIncludingDeleted()
    });
  }, LOAD_IMAGES_TIMEOUT);

  private handleRemoteSceneUpdate = (
    layers: ReconciledLayers,
    { init = false }: { init?: boolean } = {}
  ) => {
    this.excalidrawAPI.updateScene({
      layers,
      commitToHistory: !!init
    });

    // We haven't yet implemented multiplayer undo functionality, so we clear the undo stack
    // when we receive any messages from another peer. This UX can be pretty rough -- if you
    // undo, a user makes a change, and then try to redo, your layer(s) will be lost. However,
    // right now we think this is the right tradeoff.
    this.excalidrawAPI.history.clear();

    this.loadImageFiles();
  };

  private onPointerMove = () => {
    if (this.idleTimeoutId) {
      window.clearTimeout(this.idleTimeoutId);
      this.idleTimeoutId = null;
    }

    this.idleTimeoutId = window.setTimeout(this.reportIdle, IDLE_THRESHOLD);

    if (!this.activeIntervalId) {
      this.activeIntervalId = window.setInterval(
        this.reportActive,
        ACTIVE_THRESHOLD
      );
    }
  };

  private onVisibilityChange = () => {
    if (document.hidden) {
      if (this.idleTimeoutId) {
        window.clearTimeout(this.idleTimeoutId);
        this.idleTimeoutId = null;
      }
      if (this.activeIntervalId) {
        window.clearInterval(this.activeIntervalId);
        this.activeIntervalId = null;
      }
      this.onIdleStateChange(UserIdleState.AWAY);
    } else {
      this.idleTimeoutId = window.setTimeout(this.reportIdle, IDLE_THRESHOLD);
      this.activeIntervalId = window.setInterval(
        this.reportActive,
        ACTIVE_THRESHOLD
      );
      this.onIdleStateChange(UserIdleState.ACTIVE);
    }
  };

  private reportIdle = () => {
    this.onIdleStateChange(UserIdleState.IDLE);
    if (this.activeIntervalId) {
      window.clearInterval(this.activeIntervalId);
      this.activeIntervalId = null;
    }
  };

  private reportActive = () => {
    this.onIdleStateChange(UserIdleState.ACTIVE);
  };

  private initializeIdleDetector = () => {
    document.addEventListener(EVENT.POINTER_MOVE, this.onPointerMove);
    document.addEventListener(EVENT.VISIBILITY_CHANGE, this.onVisibilityChange);
  };

  setCollaborators(sockets: string[]) {
    const collaborators: InstanceType<typeof Collab>["collaborators"] =
      new Map();
    for (const socketId of sockets) {
      if (this.collaborators.has(socketId)) {
        collaborators.set(socketId, this.collaborators.get(socketId)!);
      } else {
        collaborators.set(socketId, {});
      }
    }
    this.collaborators = collaborators;
    this.excalidrawAPI.updateScene({ collaborators });
  }

  public setLastBroadcastedOrReceivedSceneVersion = (version: number) => {
    this.lastBroadcastedOrReceivedSceneVersion = version;
  };

  public getLastBroadcastedOrReceivedSceneVersion = () => {
    return this.lastBroadcastedOrReceivedSceneVersion;
  };

  public getSceneLayersIncludingDeleted = () => {
    return this.excalidrawAPI.getSceneLayersIncludingDeleted();
  };

  onPointerUpdate = throttle(
    (payload: {
      button: SocketUpdateDataSource["MOUSE_LOCATION"]["payload"]["button"];
      pointer: SocketUpdateDataSource["MOUSE_LOCATION"]["payload"]["pointer"];
      pointersMap: Gesture["pointers"];
    }) => {
      payload.pointersMap.size < 2 &&
        this.portal.socket &&
        this.portal.broadcastMouseLocation(payload);
    },
    CURSOR_SYNC_TIMEOUT
  );

  onIdleStateChange = (userState: UserIdleState) => {
    this.portal.broadcastIdleChange(userState);
  };

  broadcastLayers = (layers: readonly ExcalidrawLayer[]) => {
    if (
      getSceneVersion(layers) > this.getLastBroadcastedOrReceivedSceneVersion()
    ) {
      this.portal.broadcastScene(WS_SCENE_EVENT_TYPES.UPDATE, layers, false);
      this.lastBroadcastedOrReceivedSceneVersion = getSceneVersion(layers);
      this.queueBroadcastAllLayers();
    }
  };

  syncLayers = (layers: readonly ExcalidrawLayer[]) => {
    this.broadcastLayers(layers);
    this.queueSaveToFirebase();
  };

  queueBroadcastAllLayers = throttle(() => {
    this.portal.broadcastScene(
      WS_SCENE_EVENT_TYPES.UPDATE,
      this.excalidrawAPI.getSceneLayersIncludingDeleted(),
      true
    );
    const currentVersion = this.getLastBroadcastedOrReceivedSceneVersion();
    const newVersion = Math.max(
      currentVersion,
      getSceneVersion(this.getSceneLayersIncludingDeleted())
    );
    this.setLastBroadcastedOrReceivedSceneVersion(newVersion);
  }, SYNC_FULL_SCENE_INTERVAL_MS);

  queueSaveToFirebase = throttle(
    () => {
      if (this.portal.socketInitialized) {
        this.saveCollabRoomToFirebase(
          getSyncableLayers(this.excalidrawAPI.getSceneLayersIncludingDeleted())
        );
      }
    },
    SYNC_FULL_SCENE_INTERVAL_MS,
    { leading: false }
  );

  handleClose = () => {
    appJotaiStore.set(collabDialogShownAtom, false);
  };

  setUsername = (username: string) => {
    this.setState({ username });
  };

  onUsernameChange = (username: string) => {
    this.setUsername(username);
    saveUsernameToLocalStorage(username);
  };

  render() {
    const { username, errorMessage, activeRoomLink } = this.state;

    const { modalIsShown } = this.props;

    return (
      <>
        {modalIsShown && (
          <RoomDialog
            activeRoomLink={activeRoomLink}
            handleClose={this.handleClose}
            onRoomCreate={() => this.startCollaboration(null)}
            onRoomDestroy={this.stopCollaboration}
            onUsernameChange={this.onUsernameChange}
            setErrorMessage={(errorMessage) => {
              this.setState({ errorMessage });
            }}
            username={username}
          />
        )}
        {errorMessage && (
          <ErrorDialog onClose={() => this.setState({ errorMessage: "" })}>
            {errorMessage}
          </ErrorDialog>
        )}
      </>
    );
  }
}

declare global {
  interface Window {
    collab: InstanceType<typeof Collab>;
  }
}

if (
  process.env.NODE_ENV === ENV.TEST ||
  process.env.NODE_ENV === ENV.DEVELOPMENT
) {
  window.collab = window.collab || ({} as Window["collab"]);
}

const _Collab: React.FC<PublicProps> = (props) => {
  const [collabDialogShown] = useAtom(collabDialogShownAtom);
  return <Collab {...props} modalIsShown={collabDialogShown} />;
};

export default _Collab;

export type TCollabClass = Collab;
