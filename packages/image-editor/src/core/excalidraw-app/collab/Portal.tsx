import throttle from "lodash.throttle";

import { encryptData } from "../../../lib/data/encryption/encryption";
import { trackEvent } from "../../analytics";
import { PRECEDING_ELEMENT_KEY } from "../../constants";
import { newLayerWith } from "../../layer/mutateLayer";
import { ExcalidrawLayer } from "../../layer/types";
import { UserIdleState } from "../../types";
import {
  FILE_UPLOAD_TIMEOUT,
  WS_EVENTS,
  WS_SCENE_EVENT_TYPES
} from "../app_constants";
import {
  isSyncableLayer,
  SocketUpdateData,
  SocketUpdateDataSource
} from "../data";
import { TCollabClass } from "./Collab";
import { BroadcastedExcalidrawLayer } from "./reconciliation";

class Portal {
  collab: TCollabClass;
  socket: SocketIOClient.Socket | null = null;
  socketInitialized: boolean = false; // we don't want the socket to emit any updates until it is fully initialized
  roomId: string | null = null;
  roomKey: string | null = null;
  broadcastedLayerVersions: Map<string, number> = new Map();

  constructor(collab: TCollabClass) {
    this.collab = collab;
  }

  open(socket: SocketIOClient.Socket, id: string, key: string) {
    this.socket = socket;
    this.roomId = id;
    this.roomKey = key;

    // Initialize socket listeners
    this.socket.on("init-room", () => {
      if (this.socket) {
        this.socket.emit("join-room", this.roomId);
        trackEvent("share", "room joined");
      }
    });
    this.socket.on("new-user", async (_socketId: string) => {
      this.broadcastScene(
        WS_SCENE_EVENT_TYPES.INIT,
        this.collab.getSceneLayersIncludingDeleted(),
        /* syncAll */ true
      );
    });
    this.socket.on("room-user-change", (clients: string[]) => {
      this.collab.setCollaborators(clients);
    });

    return socket;
  }

  close() {
    if (!this.socket) {
      return;
    }
    this.queueFileUpload.flush();
    this.socket.close();
    this.socket = null;
    this.roomId = null;
    this.roomKey = null;
    this.socketInitialized = false;
    this.broadcastedLayerVersions = new Map();
  }

  isOpen() {
    return !!(
      this.socketInitialized &&
      this.socket &&
      this.roomId &&
      this.roomKey
    );
  }

  async _broadcastSocketData(
    data: SocketUpdateData,
    volatile: boolean = false
  ) {
    if (this.isOpen()) {
      const json = JSON.stringify(data);
      const encoded = new TextEncoder().encode(json);
      const { encryptedBuffer, iv } = await encryptData(this.roomKey!, encoded);

      this.socket?.emit(
        volatile ? WS_EVENTS.SERVER_VOLATILE : WS_EVENTS.SERVER,
        this.roomId,
        encryptedBuffer,
        iv
      );
    }
  }

  queueFileUpload = throttle(async () => {
    try {
      await this.collab.fileManager.saveFiles({
        layers: this.collab.excalidrawAPI.getSceneLayersIncludingDeleted(),
        files: this.collab.excalidrawAPI.getFiles()
      });
    } catch (error: any) {
      if (error.name !== "AbortError") {
        this.collab.excalidrawAPI.updateScene({
          editorState: {
            errorMessage: error.message
          }
        });
      }
    }

    this.collab.excalidrawAPI.updateScene({
      layers: this.collab.excalidrawAPI
        .getSceneLayersIncludingDeleted()
        .map((layer) => {
          if (this.collab.fileManager.shouldUpdateImageLayerStatus(layer)) {
            // this will signal collaborators to pull image data from server
            // (using mutation instead of newLayerWith otherwise it'd break
            // in-progress dragging)
            return newLayerWith(layer, { status: "saved" });
          }
          return layer;
        })
    });
  }, FILE_UPLOAD_TIMEOUT);

  broadcastScene = async (
    updateType: WS_SCENE_EVENT_TYPES.INIT | WS_SCENE_EVENT_TYPES.UPDATE,
    allLayers: readonly ExcalidrawLayer[],
    syncAll: boolean
  ) => {
    if (updateType === WS_SCENE_EVENT_TYPES.INIT && !syncAll) {
      throw new Error("syncAll must be true when sending SCENE.INIT");
    }

    // sync out only the layers we think we need to to save bandwidth.
    // periodically we'll resync the whole thing to make sure no one diverges
    // due to a dropped message (server goes down etc).
    const syncableLayers = allLayers.reduce(
      (acc, layer: BroadcastedExcalidrawLayer, idx, layers) => {
        if (
          (syncAll ||
            !this.broadcastedLayerVersions.has(layer.id) ||
            layer.version > this.broadcastedLayerVersions.get(layer.id)!) &&
          isSyncableLayer(layer)
        ) {
          acc.push({
            ...layer,
            // z-index info for the reconciler
            [PRECEDING_ELEMENT_KEY]: idx === 0 ? "^" : layers[idx - 1]?.id
          });
        }
        return acc;
      },
      [] as BroadcastedExcalidrawLayer[]
    );

    const data: SocketUpdateDataSource[typeof updateType] = {
      type: updateType,
      payload: {
        layers: syncableLayers
      }
    };

    for (const syncableLayer of syncableLayers) {
      this.broadcastedLayerVersions.set(
        syncableLayer.id,
        syncableLayer.version
      );
    }

    this.queueFileUpload();

    await this._broadcastSocketData(data as SocketUpdateData);
  };

  broadcastIdleChange = (userState: UserIdleState) => {
    if (this.socket?.id) {
      const data: SocketUpdateDataSource["IDLE_STATUS"] = {
        type: "IDLE_STATUS",
        payload: {
          socketId: this.socket.id,
          userState,
          username: this.collab.state.username
        }
      };
      return this._broadcastSocketData(
        data as SocketUpdateData,
        true // volatile
      );
    }
  };

  broadcastMouseLocation = (payload: {
    button: SocketUpdateDataSource["MOUSE_LOCATION"]["payload"]["button"];
    pointer: SocketUpdateDataSource["MOUSE_LOCATION"]["payload"]["pointer"];
  }) => {
    if (this.socket?.id) {
      const data: SocketUpdateDataSource["MOUSE_LOCATION"] = {
        type: "MOUSE_LOCATION",
        payload: {
          socketId: this.socket.id,
          pointer: payload.pointer,
          button: payload.button || "up",
          selectedLayerIds:
            this.collab.excalidrawAPI.getAppState().selectedLayerIds,
          username: this.collab.state.username
        }
      };
      return this._broadcastSocketData(
        data as SocketUpdateData,
        true // volatile
      );
    }
  };
}

export default Portal;
