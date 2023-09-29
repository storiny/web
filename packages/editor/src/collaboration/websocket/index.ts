/* eslint-disable no-dupe-class-members */

import { dev_console } from "../../../../shared/src/utils/dev-log";
import { publish, subscribe, unsubscribe } from "lib0/broadcastchannel";
import * as decoding from "lib0/decoding";
import * as encoding from "lib0/encoding";
import * as url from "lib0/url";
import * as authProtocol from "y-protocols/auth";
import * as awarenessProtocol from "y-protocols/awareness";
import { Awareness } from "y-protocols/awareness";
import * as syncProtocol from "y-protocols/sync";
import { Doc } from "yjs";

export type ProviderEvent =
  | "status"
  | "synced"
  | "sync"
  | "update"
  | "reload"
  | "connection-error"
  | "connection-close"
  | "auth";

type AnyFunction = (...args: any) => any;

type ProviderEventHandle = <N extends ProviderEvent>(
  name: N,
  fn: N extends "sync" | "synced"
    ? (isSynced: boolean) => void
    : N extends "auth"
    ? (reason: "forbidden" | "overloaded") => void
    : N extends "status"
    ? (arg: { status: "connecting" | "connected" | "disconnected" }) => void
    : N extends "update"
    ? (arg: unknown) => void
    : N extends "reload"
    ? (doc: Doc) => void
    : N extends `connection-${"error" | "close"}`
    ? (event: Event) => void
    : AnyFunction
) => void;

type MessageHandler = (
  encoder: encoding.Encoder,
  decoder: decoding.Decoder,
  provider: WebsocketProvider,
  emitSynced: boolean,
  messageType: number
) => void;

enum Message {
  SYNC /*           */ = 0,
  AWARENESS /*      */ = 1,
  AUTH /*           */ = 2,
  QUERY_AWARENESS /**/ = 3
}

const MESSAGE_RECONNECT_TIMEOUT = 30000;
const MESSAGE_HANDLERS: Array<MessageHandler> = [];

/**
 * Sync message
 * @param encoder Encoder
 * @param decoder Decoder
 * @param provider Websocket provider
 * @param emitSynced Whether to emit synced event to the provider
 */
MESSAGE_HANDLERS[Message.SYNC] = (
  encoder,
  decoder,
  provider,
  emitSynced
): void => {
  encoding.writeVarUint(encoder, Message.SYNC);
  const syncMessageType = syncProtocol.readSyncMessage(
    decoder,
    encoder,
    provider.doc,
    provider
  );

  if (
    emitSynced &&
    syncMessageType === syncProtocol.messageYjsSyncStep2 &&
    !provider.synced
  ) {
    provider.synced = true;
  }
};

/**
 * Query awareness message
 * @param encoder Encoder
 * @param _
 * @param provider Websocket provider
 */
MESSAGE_HANDLERS[Message.QUERY_AWARENESS] = (encoder, _, provider): void => {
  encoding.writeVarUint(encoder, Message.AWARENESS);
  encoding.writeVarUint8Array(
    encoder,
    awarenessProtocol.encodeAwarenessUpdate(
      provider.awareness,
      Array.from(provider.awareness.getStates().keys())
    )
  );
};

/**
 * Awareness message
 * @param _
 * @param decoder Decoder
 * @param provider Websocket provider
 */
MESSAGE_HANDLERS[Message.AWARENESS] = (_, decoder, provider): void => {
  awarenessProtocol.applyAwarenessUpdate(
    provider.awareness,
    decoding.readVarUint8Array(decoder),
    provider
  );
};

/**
 * Auth message
 * @param _
 * @param decoder Decoder
 * @param provider Websocket provider
 */
MESSAGE_HANDLERS[Message.AUTH] = (_, decoder, provider): void => {
  authProtocol.readAuthMessage(decoder, provider.doc, (_, reason) =>
    provider.emit("auth", [reason as "forbidden" | "overloaded"])
  );
};

/**
 * Reads an incoming message
 * @param provider Websocket provider
 * @param buf Message buffer data
 * @param emitSynced Emit synced flag
 */
const readMessage = (
  provider: WebsocketProvider,
  buf: Uint8Array,
  emitSynced: boolean
): encoding.Encoder => {
  const decoder = decoding.createDecoder(buf);
  const encoder = encoding.createEncoder();
  const messageType = decoding.readVarUint(decoder);
  const messageHandler = provider.messageHandlers[messageType];

  if (messageHandler) {
    messageHandler(encoder, decoder, provider, emitSynced, messageType);
  } else {
    dev_console.error("Unable to compute the message");
  }

  return encoder;
};

/**
 * Sets up the websocket
 * @param provider Websocket provider
 */
const setupWS = (provider: WebsocketProvider): void => {
  if (provider.shouldConnect && provider.ws === null) {
    const websocket = new provider.wsPolyfill(provider.url);
    websocket.binaryType = "arraybuffer";

    provider.ws = websocket;
    provider.wsconnecting = true;
    provider.wsconnected = false;
    provider.synced = false;

    websocket.onmessage = (event): void => {
      provider.wsLastMessageReceived = Date.now();
      const encoder = readMessage(provider, new Uint8Array(event.data), true);

      if (encoding.length(encoder) > 1) {
        websocket.send(encoding.toUint8Array(encoder));
      }
    };

    websocket.onerror = (event): void => {
      provider.emit("connection-error", [event, provider]);
    };

    websocket.onclose = (event): void => {
      provider.emit("connection-close", [event, provider]);
      provider.ws = null;
      provider.wsconnecting = false;

      if (provider.wsconnected) {
        provider.wsconnected = false;
        provider.synced = false;

        // Update awareness (all users except the local)
        awarenessProtocol.removeAwarenessStates(
          provider.awareness,
          Array.from(provider.awareness.getStates().keys()).filter(
            (client) => client !== provider.doc.clientID
          ),
          provider
        );

        provider.emit("status", [
          {
            status: "disconnected"
          }
        ]);
      } else {
        provider.wsUnsuccessfulReconnects++;
      }

      // Start with no reconnect timeout and increase the timeout by
      // Using exponential backoff starting with 100ms
      setTimeout(
        setupWS,
        Math.min(
          Math.pow(2, provider.wsUnsuccessfulReconnects) * 100,
          provider.maxBackoffTime
        ),
        provider
      );
    };

    websocket.onopen = (): void => {
      provider.wsLastMessageReceived = Date.now();
      provider.wsconnecting = false;
      provider.wsconnected = true;
      provider.wsUnsuccessfulReconnects = 0;

      provider.emit("status", [
        {
          status: "connected"
        }
      ]);

      // Always send sync step 1 when connected
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, Message.SYNC);
      syncProtocol.writeSyncStep1(encoder, provider.doc);
      websocket.send(encoding.toUint8Array(encoder));

      // Broadcast local awareness state
      if (provider.awareness.getLocalState() !== null) {
        const encoderAwarenessState = encoding.createEncoder();
        encoding.writeVarUint(encoderAwarenessState, Message.AWARENESS);
        encoding.writeVarUint8Array(
          encoderAwarenessState,
          awarenessProtocol.encodeAwarenessUpdate(provider.awareness, [
            provider.doc.clientID
          ])
        );

        websocket.send(encoding.toUint8Array(encoderAwarenessState));
      }
    };

    provider.emit("status", [
      {
        status: "connecting"
      }
    ]);
  }
};

/**
 * Broadcasts a message to all the clients through the websocket channel, with a broadcast channel fallback
 * @param provider Websocket provider
 * @param buf Message buffer data
 */
const broadcastMessage = (
  provider: WebsocketProvider,
  buf: ArrayBuffer
): void => {
  const ws = provider.ws;

  if (provider.wsconnected && ws && ws.readyState === ws.OPEN) {
    ws.send(buf);
  }

  if (provider.bcconnected) {
    publish(provider.bcChannel, buf, provider);
  }
};

/**
 * Returns a map entry, and creates one if it does not exist
 * @param map Map
 * @param key Entry key
 * @param createEntry Function to create a new entry if it does not exist on the map
 */
const setIfUndefined = <V, K>(
  map: Map<K, V>,
  key: K,
  createEntry: () => V
): V => {
  let set = map.get(key);

  if (set === undefined) {
    map.set(key, (set = createEntry()));
  }

  return set;
};

/**
 * Websocket Provider for Yjs. Creates a websocket connection to sync the shared document.
 * The document name is appended to the provided url (scheme://<url>/<document-name>)
 */
export class WebsocketProvider {
  /**
   * Ctor
   * @param serverUrl URL of the server
   * @param roomname Room / document name (gets appended to the `serverUrl`)
   * @param doc Document
   * @param connect Whether to initiate the connection
   * @param awareness Awareness
   * @param params Additional params to append to the final URL
   * @param WebSocketPolyfill Websocket polyfill
   * @param resyncInterval Interval time (in ms) to request the server state
   * @param maxBackoffTime Maximum amount of time to wait before trying to reconnect (exponential backoff, ms)
   * @param disableBc Whether to disable cross-tab broadcast channel communication
   */
  constructor(
    serverUrl: string,
    roomname: string,
    doc: Doc,
    {
      connect = true,
      awareness = new awarenessProtocol.Awareness(doc),
      params = {},
      WebSocketPolyfill = WebSocket,
      resyncInterval = -1,
      maxBackoffTime = 2500,
      disableBc = false
    }: {
      WebSocketPolyfill?: typeof WebSocket;
      awareness?: awarenessProtocol.Awareness;
      connect?: boolean;
      disableBc?: boolean;
      maxBackoffTime?: number;
      params?: Record<string, string>;
      resyncInterval?: number;
    } = {}
  ) {
    // Ensure that the URL always ends with `/`
    while (serverUrl[serverUrl.length - 1] === "/") {
      serverUrl = serverUrl.slice(0, serverUrl.length - 1);
    }

    const encodedParams = url.encodeQueryParams(params);

    this.observers = new Map<string, Set<any>>();
    this.maxBackoffTime = maxBackoffTime;
    this.bcChannel = `${serverUrl}/${roomname}`;
    this.url = `${serverUrl}/${roomname}${
      encodedParams.length === 0 ? "" : "?" + encodedParams
    }`;
    this.roomname = roomname;
    this.doc = doc;
    this.wsPolyfill = WebSocketPolyfill;
    this.awareness = awareness;
    this.wsconnected = false;
    this.wsconnecting = false;
    this.bcconnected = false;
    this.disableBc = disableBc;
    this.wsUnsuccessfulReconnects = 0;
    this.messageHandlers = MESSAGE_HANDLERS.slice();
    this._synced = false;
    this.ws = null;
    this.wsLastMessageReceived = 0;
    this.shouldConnect = connect;
    this.resyncInterval = 0;

    if (resyncInterval > 0) {
      this.resyncInterval = setInterval(() => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          // Resend sync step 1
          const encoder = encoding.createEncoder();
          encoding.writeVarUint(encoder, Message.SYNC);
          syncProtocol.writeSyncStep1(encoder, doc);
          this.ws.send(encoding.toUint8Array(encoder));
        }
      }, resyncInterval);
    }

    /**
     * Broadcast channel handler
     * @param data Data
     * @param origin Origin
     */
    this.bcSubscriber = (data: ArrayBuffer, origin: any): void => {
      if (origin !== this) {
        const encoder = readMessage(this, new Uint8Array(data), false);
        if (encoding.length(encoder) > 1) {
          publish(this.bcChannel, encoding.toUint8Array(encoder), this);
        }
      }
    };

    /**
     * Listens to Yjs updates and sends them to the remote peers (websocket and broadcast channel)
     * @param update Update data
     * @param origin Origin
     */
    this.updateHandler = (update: Uint8Array, origin: any): void => {
      if (origin !== this) {
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, Message.SYNC);
        syncProtocol.writeUpdate(encoder, update);
        broadcastMessage(this, encoding.toUint8Array(encoder));
      }
    };

    this.doc.on("update", this.updateHandler);

    /**
     * Awareness update handler
     * @param added Clients added
     * @param updated Clients updated
     * @param removed Clients removed
     */
    this.awarenessUpdateHandler = ({
      added,
      updated,
      removed
    }: {
      added: number[];
      removed: number[];
      updated: number[];
    }): void => {
      const changedClients = added.concat(updated).concat(removed);
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, Message.AWARENESS);
      encoding.writeVarUint8Array(
        encoder,
        awarenessProtocol.encodeAwarenessUpdate(awareness, changedClients)
      );

      broadcastMessage(this, encoding.toUint8Array(encoder));
    };

    /**
     * Unload handler (removes awareness state)
     */
    this.unloadHandler = (): void => {
      awarenessProtocol.removeAwarenessStates(
        this.awareness,
        [doc.clientID],
        "window unload"
      );
    };

    if (typeof window !== "undefined") {
      window.addEventListener("unload", this.unloadHandler);
    } else if (typeof process !== "undefined") {
      process.on("exit", this.unloadHandler);
    }

    awareness.on("update", this.awarenessUpdateHandler);

    this.checkInterval = setInterval(() => {
      if (
        this.wsconnected &&
        MESSAGE_RECONNECT_TIMEOUT < Date.now() - this.wsLastMessageReceived
      ) {
        // Close the connection when no messages are received since a long duration,
        // Not even the client's own awareness updates (which are updated every 15 seconds)
        this.ws?.close();
      }
    }, MESSAGE_RECONNECT_TIMEOUT / 10);

    if (connect) {
      this.connect();
    }
  }

  /**
   * Observer map
   * @private
   */
  private observers: Map<string, Set<any>>;
  /**
   * Maximum backoff time (in ms)
   */
  public maxBackoffTime: number;
  /**
   * Broadcast channel slug
   */
  public bcChannel: string;
  /**
   * Server URL (with roomname and params)
   */
  public url: string;
  /**
   * Room name
   */
  public roomname: string;
  /**
   * Document
   */
  public doc: Doc;
  /**
   * Awareness
   */
  public awareness: Awareness;
  /**
   * Websocket connected flag
   */
  public wsconnected: boolean;
  /**
   * Websocket connecting flag
   */
  public wsconnecting: boolean;
  /**
   * Broadcast channel connected flag
   */
  public bcconnected: boolean;
  /**
   * Broadcast channel disbaled flag
   */
  public disableBc: boolean;
  /**
   * Number of unsuccessful reconnect attempts
   */
  public wsUnsuccessfulReconnects: number;
  /**
   * Message handlers
   */
  public messageHandlers: MessageHandler[];
  /**
   * Websocket instance
   */
  public ws: WebSocket | null;
  /**
   * Timestamp of the last message received from the server
   */
  public wsLastMessageReceived: number;
  /**
   * Whether to connect to other peers or not
   */
  public shouldConnect: boolean;
  /**
   * Broadcast channel subscriber
   * @private
   */
  private readonly bcSubscriber: (data: ArrayBuffer, origin: any) => void;
  /**
   * Update handler (listens to Yjs changes)
   * @private
   */
  private readonly updateHandler: (update: Uint8Array, origin: any) => void;
  /**
   * Unlaod handler (removes the awareness data)
   * @private
   */
  private readonly unloadHandler: () => void;
  /**
   * Awareness update handler
   * @private
   */
  private readonly awarenessUpdateHandler: (_: {
    added: number[];
    removed: number[];
    updated: number[];
  }) => void;
  /**
   * Resync internal (in ms)
   * @private
   */
  private readonly resyncInterval: number | NodeJS.Timer;
  /**
   * Interval (in ms) for checking whether the connection is still alive
   * @private
   */
  private readonly checkInterval: NodeJS.Timer;
  /**
   * Websocket polyfill
   */
  public wsPolyfill: typeof WebSocket;

  /**
   * Adds a new event listener
   * @param name Name of the event
   * @param fn Listener function
   */
  public on: ProviderEventHandle = (name, fn) => {
    setIfUndefined(this.observers, name, () => new Set()).add(fn);
    return fn;
  };

  /**
   * Adds a new event listener for a single cycle
   * @param name Name of the event
   * @param fn Listener function
   */
  public once: ProviderEventHandle = (name, fn) => {
    const onceFn: any = (...args: unknown[]): void => {
      this.off(name, onceFn);
      // @ts-ignore
      fn(...args);
    };

    this.on(name, onceFn);
  };

  /**
   * Removes an event listener
   * @param name Name of the event
   * @param fn Listener function
   */
  public off: ProviderEventHandle = (name, fn) => {
    const observers = this.observers.get(name);

    if (observers !== undefined) {
      observers.delete(fn);

      if (observers.size === 0) {
        this.observers.delete(name);
      }
    }
  };

  /**
   * Synced flag
   * @private
   */
  private _synced: boolean;

  /**
   * Returns the synced flag
   */
  public get synced(): boolean {
    return this._synced;
  }

  /**
   * Sets the synced flag
   * @param state Synced state
   */
  public set synced(state) {
    if (this._synced !== state) {
      this._synced = state;
      this.emit("synced", [state]);
      this.emit("sync", [state]);
    }
  }

  /**
   * Emits a named event. All registered event listeners that listen to the
   * specified name will receive the event
   * @param name Name of the event
   * @param args Arguments that are applied to the event listener
   */
  public emit(name: ProviderEvent, args: any[]): void {
    // Copy all listeners to an array first to make sure that no event is emitted to the
    // Listeners that are subscribed while the event handler is being called
    return Array.from((this.observers.get(name) || new Map()).values()).forEach(
      (fn) => fn(...args)
    );
  }

  /**
   * Destroys the provider instance
   */
  public destroy(): void {
    if (this.resyncInterval !== 0) {
      clearInterval(this.resyncInterval);
    }

    clearInterval(this.checkInterval);
    this.disconnect();

    if (typeof window !== "undefined") {
      window.removeEventListener("unload", this.unloadHandler);
    } else if (typeof process !== "undefined") {
      process.off("exit", this.unloadHandler);
    }

    this.awareness.off("update", this.awarenessUpdateHandler);
    this.doc.off("update", this.updateHandler);
    this.observers = new Map();
  }

  /**
   * Connects to the broadcast channel
   */
  public connectBc(): void {
    if (this.disableBc) {
      return;
    }

    if (!this.bcconnected) {
      subscribe(this.bcChannel, this.bcSubscriber);
      this.bcconnected = true;
    }

    // Send sync step1 to the broadcast channel
    // Write sync step 1
    const encoderSync = encoding.createEncoder();
    encoding.writeVarUint(encoderSync, Message.SYNC);
    syncProtocol.writeSyncStep1(encoderSync, this.doc);
    publish(this.bcChannel, encoding.toUint8Array(encoderSync), this);

    // Broadcast the local state
    const encoderState = encoding.createEncoder();
    encoding.writeVarUint(encoderState, Message.SYNC);
    syncProtocol.writeSyncStep2(encoderState, this.doc);
    publish(this.bcChannel, encoding.toUint8Array(encoderState), this);

    // Write query awareness
    const encoderAwarenessQuery = encoding.createEncoder();
    encoding.writeVarUint(encoderAwarenessQuery, Message.QUERY_AWARENESS);
    publish(this.bcChannel, encoding.toUint8Array(encoderAwarenessQuery), this);

    // Broadcast the local awareness state
    const encoderAwarenessState = encoding.createEncoder();
    encoding.writeVarUint(encoderAwarenessState, Message.AWARENESS);
    encoding.writeVarUint8Array(
      encoderAwarenessState,
      awarenessProtocol.encodeAwarenessUpdate(this.awareness, [
        this.doc.clientID
      ])
    );
    publish(this.bcChannel, encoding.toUint8Array(encoderAwarenessState), this);
  }

  /**
   * Diconnects from the broadcast channel
   */
  public disconnectBc(): void {
    // Broadcast message with the local awareness state set to `null` (indicating disconnect)
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, Message.AWARENESS);
    encoding.writeVarUint8Array(
      encoder,
      awarenessProtocol.encodeAwarenessUpdate(
        this.awareness,
        [this.doc.clientID],
        new Map()
      )
    );
    broadcastMessage(this, encoding.toUint8Array(encoder));

    if (this.bcconnected) {
      unsubscribe(this.bcChannel, this.bcSubscriber);
      this.bcconnected = false;
    }
  }

  /**
   * Disconnects the instance from the server
   */
  public disconnect(): void {
    this.shouldConnect = false;
    this.disconnectBc();

    if (this.ws !== null) {
      this.ws.close();
    }
  }

  /**
   * Connects the instance to the server
   */
  public connect(): void {
    this.shouldConnect = true;
    if (!this.wsconnected && this.ws === null) {
      setupWS(this);
      this.connectBc();
    }
  }
}
