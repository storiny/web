/* eslint-disable no-dupe-class-members */

import { dev_console } from "@storiny/shared/src/utils/dev-log";
import { publish, subscribe, unsubscribe } from "lib0/broadcastchannel";
import * as decoding from "lib0/decoding";
import * as encoding from "lib0/encoding";
import * as url from "lib0/url";
import * as auth_protocol from "y-protocols/auth";
import * as awareness_protocol from "y-protocols/awareness";
import { Awareness } from "y-protocols/awareness";
import * as sync_protocol from "y-protocols/sync";
import { Doc } from "yjs";

export type ProviderEvent =
  | "stale"
  | "status"
  | "synced"
  | "sync"
  | "update"
  | "reload"
  | "connection-error"
  | "connection-close"
  | "auth"
  | "destroy";

type AnyFunction = (...args: any) => any;

type ProviderEventHandle = <N extends ProviderEvent>(
  name: N,
  fn: N extends "sync" | "synced"
    ? (is_synced: boolean) => void
    : N extends "auth"
      ? (reason: "forbidden") => void
      : N extends "destroy"
        ? (
            reason:
              | "story_published"
              | "story_unpublished"
              | "story_deleted"
              | "doc_overload"
              | "lifetime_exceeded"
              | "internal"
          ) => void
        : N extends "status"
          ? (arg: {
              status: "connecting" | "connected" | "disconnected";
            }) => void
          : N extends "update"
            ? (arg: unknown) => void
            : N extends "reload"
              ? (doc: Doc) => void
              : N extends "connection-error"
                ? (event: Event) => void
                : N extends "connection-close"
                  ? (event: CloseEvent) => void
                  : N extends "stale"
                    ? () => void
                    : AnyFunction
) => void;

type MessageHandler = (
  encoder: encoding.Encoder,
  decoder: decoding.Decoder,
  provider: WebsocketProvider,
  emit_synced: boolean,
  message_type: number
) => void;

enum Message {
  SYNC /*           */ = 0,
  AWARENESS /*      */ = 1,
  AUTH /*           */ = 2,
  QUERY_AWARENESS /**/ = 3,
  // Internal messages sent by the server
  INTERNAL /*       */ = 4
}

const MESSAGE_RECONNECT_TIMEOUT = 30000;
const MESSAGE_HANDLERS: Array<MessageHandler> = [];

/**
 * Sync message
 * @param encoder Encoder
 * @param decoder Decoder
 * @param provider Websocket provider
 * @param emit_synced Whether to emit synced event to the provider
 */
MESSAGE_HANDLERS[Message.SYNC] = (
  encoder,
  decoder,
  provider,
  emit_synced
): void => {
  encoding.writeVarUint(encoder, Message.SYNC);
  const sync_message_type = sync_protocol.readSyncMessage(
    decoder,
    encoder,
    provider.doc,
    provider
  );

  if (
    emit_synced &&
    sync_message_type === sync_protocol.messageYjsSyncStep2 &&
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
    awareness_protocol.encodeAwarenessUpdate(
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
  awareness_protocol.applyAwarenessUpdate(
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
  auth_protocol.readAuthMessage(decoder, provider.doc, (_, reason) =>
    provider.emit("auth", [reason as "forbidden" | "overloaded"])
  );
};

/**
 * Internal event message sent by the server
 * @param _
 * @param decoder Decoder
 * @param provider Websocket provider
 */
MESSAGE_HANDLERS[Message.INTERNAL] = (_, decoder, provider): void => {
  const event_message = decoding.readVarString(decoder);
  const reason = event_message.split(":")[1] || event_message;
  provider.emit("destroy", [reason]);
  provider.destroy();
};

/**
 * Reads an incoming message
 * @param provider Websocket provider
 * @param buf Message buffer data
 * @param emit_synced Emit synced flag
 */
const read_message = (
  provider: WebsocketProvider,
  buf: Uint8Array,
  emit_synced: boolean
): encoding.Encoder => {
  const decoder = decoding.createDecoder(buf);
  const encoder = encoding.createEncoder();
  const message_type = decoding.readVarUint(decoder);
  const message_handler = provider.message_handlers[message_type];

  if (message_handler) {
    message_handler(encoder, decoder, provider, emit_synced, message_type);
  } else {
    dev_console.error("Unable to compute the message");
  }

  return encoder;
};

/**
 * Sets up the websocket
 * @param provider Websocket provider
 */
const setup_ws = (provider: WebsocketProvider): void => {
  if (provider.should_connect && provider.ws === null) {
    const websocket = new provider.ws_polyfill(provider.url);
    websocket.binaryType = "arraybuffer";

    provider.ws = websocket;
    provider.wsconnecting = true;
    provider.wsconnected = false;
    provider.synced = false;

    websocket.onmessage = (event): void => {
      provider.ws_last_message_received = Date.now();
      const encoder = read_message(provider, new Uint8Array(event.data), true);

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
        awareness_protocol.removeAwarenessStates(
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
        // Codes > 3000 or 1006 indicate a client or internal error sent by the
        // server.
      } else if (event.code < 3000 && event.code !== 1006) {
        provider.ws_unsuccessful_reconnects++;
      }

      // Do not reconnect for client or internal server sent errors.
      if (event.code < 3000 && event.code !== 1006) {
        // Start with no reconnect timeout and increase the timeout by
        // Using exponential backoff starting with 100ms
        setTimeout(
          setup_ws,
          Math.min(
            Math.pow(2, provider.ws_unsuccessful_reconnects) * 100,
            provider.max_backoff_time
          ),
          provider
        );
      }
    };

    websocket.onopen = (): void => {
      provider.ws_last_message_received = Date.now();
      provider.wsconnecting = false;
      provider.wsconnected = true;
      provider.ws_unsuccessful_reconnects = 0;

      provider.emit("status", [
        {
          status: "connected"
        }
      ]);

      // Always send sync step 1 when connected
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, Message.SYNC);
      sync_protocol.writeSyncStep1(encoder, provider.doc);
      websocket.send(encoding.toUint8Array(encoder));

      // Broadcast local awareness state
      if (provider.awareness.getLocalState() !== null) {
        const encoder_awareness_state = encoding.createEncoder();
        encoding.writeVarUint(encoder_awareness_state, Message.AWARENESS);
        encoding.writeVarUint8Array(
          encoder_awareness_state,
          awareness_protocol.encodeAwarenessUpdate(provider.awareness, [
            provider.doc.clientID
          ])
        );

        websocket.send(encoding.toUint8Array(encoder_awareness_state));
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
const broadcast_message = (
  provider: WebsocketProvider,
  buf: ArrayBuffer
): void => {
  const ws = provider.ws;

  if (provider.wsconnected && ws && ws.readyState === ws.OPEN) {
    ws.send(buf);
  }

  if (provider.bcconnected) {
    publish(provider.bc_channel, buf, provider);
  }
};

/**
 * Returns a map entry, and creates one if it does not exist
 * @param map Map
 * @param key Entry key
 * @param create_entry Function to create a new entry if it does not exist on the map
 */
const set_if_undefined = <V, K>(
  map: Map<K, V>,
  key: K,
  create_entry: () => V
): V => {
  let set = map.get(key);

  if (set === undefined) {
    map.set(key, (set = create_entry()));
  }

  return set;
};

/**
 * Websocket Provider for Yjs. Creates a websocket connection to sync the
 * shared document. The document name is appended to the provided url
 * (scheme://<url>/<document-name>)
 */
export class WebsocketProvider {
  /**
   * Ctor
   * @param server_url URL of the server
   * @param auth_token Session cookie value
   * @param roomname Room / document name (gets appended to the `server_url`)
   * @param doc Document
   * @param connect Whether to initiate the connection
   * @param awareness Awareness
   * @param params Additional params to append to the final URL
   * @param ws_polyfill Websocket polyfill
   * @param resync_interval Interval time (in ms) to request the server state
   * @param max_backoff_time Maximum amount of time to wait before trying to reconnect (exponential backoff, ms)
   * @param disable_bc Whether to disable cross-tab broadcast channel communication
   */
  constructor(
    server_url: string,
    auth_token: string,
    roomname: string,
    doc: Doc,
    {
      connect = true,
      awareness = new awareness_protocol.Awareness(doc),
      params = {},
      ws_polyfill = WebSocket,
      resync_interval = -1,
      max_backoff_time = 2500,
      disable_bc = false
    }: {
      awareness?: awareness_protocol.Awareness;
      connect?: boolean;
      disable_bc?: boolean;
      max_backoff_time?: number;
      params?: Record<string, string>;
      resync_interval?: number;
      ws_polyfill?: typeof WebSocket;
    } = {}
  ) {
    // Ensure that the URL always ends with `/`
    while (server_url[server_url.length - 1] === "/") {
      server_url = server_url.slice(0, server_url.length - 1);
    }

    const encoded_params = url.encodeQueryParams(params);

    this.observers = new Map<string, Set<any>>();
    this.max_backoff_time = max_backoff_time;
    this.bc_channel = `${server_url}/${roomname}`;
    this.url = `${server_url}/${roomname}?auth_token=${auth_token}${
      encoded_params.length === 0 ? "" : "&" + encoded_params
    }`;
    this.roomname = roomname;
    this.doc = doc;
    this.ws_polyfill = ws_polyfill;
    this.awareness = awareness;
    this.wsconnected = false;
    this.wsconnecting = false;
    this.bcconnected = false;
    this.disable_bc = disable_bc;
    this.ws_unsuccessful_reconnects = 0;
    this.message_handlers = MESSAGE_HANDLERS.slice();
    this._synced = false;
    this.ws = null;
    this.ws_last_message_received = 0;
    this.should_connect = connect;
    this.resync_interval = 0;

    if (resync_interval > 0) {
      this.resync_interval = setInterval(() => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          // Resend sync step 1
          const encoder = encoding.createEncoder();
          encoding.writeVarUint(encoder, Message.SYNC);
          sync_protocol.writeSyncStep1(encoder, doc);
          this.ws.send(encoding.toUint8Array(encoder));
        }
      }, resync_interval);
    }

    /**
     * Broadcast channel handler
     * @param data Data
     * @param origin Origin
     */
    this.bc_subscriber = (data: ArrayBuffer, origin: any): void => {
      if (origin !== this) {
        const encoder = read_message(this, new Uint8Array(data), false);
        if (encoding.length(encoder) > 1) {
          publish(this.bc_channel, encoding.toUint8Array(encoder), this);
        }
      }
    };

    /**
     * Listens to Yjs updates and sends them to the remote peers (websocket and broadcast channel)
     * @param update Update data
     * @param origin Origin
     */
    this.update_handler = (update: Uint8Array, origin: any): void => {
      if (origin !== this) {
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, Message.SYNC);
        sync_protocol.writeUpdate(encoder, update);
        broadcast_message(this, encoding.toUint8Array(encoder));
      }
    };

    this.doc.on("update", this.update_handler);

    /**
     * Awareness update handler
     * @param added Clients added
     * @param updated Clients updated
     * @param removed Clients removed
     */
    this.awareness_update_handler = ({
      added,
      updated,
      removed
    }: {
      added: number[];
      removed: number[];
      updated: number[];
    }): void => {
      const changed_clients = added.concat(updated).concat(removed);
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, Message.AWARENESS);
      encoding.writeVarUint8Array(
        encoder,
        awareness_protocol.encodeAwarenessUpdate(awareness, changed_clients)
      );

      broadcast_message(this, encoding.toUint8Array(encoder));
    };

    /**
     * Unload handler (removes awareness state)
     */
    this.unload_handler = (): void => {
      awareness_protocol.removeAwarenessStates(
        this.awareness,
        [doc.clientID],
        "window unload"
      );
    };

    if (typeof window !== "undefined") {
      window.addEventListener("unload", this.unload_handler);
    } else if (typeof process !== "undefined") {
      process.on("exit", this.unload_handler);
    }

    awareness.on("update", this.awareness_update_handler);

    this.check_interval = setInterval(() => {
      if (
        this.wsconnected &&
        MESSAGE_RECONNECT_TIMEOUT < Date.now() - this.ws_last_message_received
      ) {
        // Close the connection when no messages are received since a long
        // duration, Not even the client's own awareness updates (which are
        // updated every 15 seconds)
        this.emit("stale", []);
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
  public max_backoff_time: number;
  /**
   * Broadcast channel slug
   */
  public bc_channel: string;
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
  public disable_bc: boolean;
  /**
   * Number of unsuccessful reconnect attempts
   */
  public ws_unsuccessful_reconnects: number;
  /**
   * Message handlers
   */
  public message_handlers: MessageHandler[];
  /**
   * Websocket instance
   */
  public ws: WebSocket | null;
  /**
   * Timestamp of the last message received from the server
   */
  public ws_last_message_received: number;
  /**
   * Whether to connect to other peers or not
   */
  public should_connect: boolean;
  /**
   * Broadcast channel subscriber
   * @private
   */
  private readonly bc_subscriber: (data: ArrayBuffer, origin: any) => void;
  /**
   * Update handler (listens to Yjs changes)
   * @private
   */
  private readonly update_handler: (update: Uint8Array, origin: any) => void;
  /**
   * Unlaod handler (removes the awareness data)
   * @private
   */
  private readonly unload_handler: () => void;
  /**
   * Awareness update handler
   * @private
   */
  private readonly awareness_update_handler: (_: {
    added: number[];
    removed: number[];
    updated: number[];
  }) => void;
  /**
   * Resync internal (in ms)
   * @private
   */
  private readonly resync_interval: number | NodeJS.Timer;
  /**
   * Interval (in ms) for checking whether the connection is still alive
   * @private
   */
  private readonly check_interval: NodeJS.Timer;
  /**
   * Websocket polyfill
   */
  public ws_polyfill: typeof WebSocket;

  /**
   * Adds a new event listener
   * @param name Name of the event
   * @param fn Listener function
   */
  public on: ProviderEventHandle = (name, fn) => {
    set_if_undefined(this.observers, name, () => new Set()).add(fn);
    return fn;
  };

  /**
   * Adds a new event listener for a single cycle
   * @param name Name of the event
   * @param fn Listener function
   */
  public once: ProviderEventHandle = (name, fn) => {
    const once_fn: any = (...args: unknown[]): void => {
      this.off(name, once_fn);
      // @ts-expect-error args are known
      fn(...args);
    };

    this.on(name, once_fn);
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
    // Copy all listeners to an array first to make sure that no event is
    // emitted to the Listeners that are subscribed while the event handler is
    // being called
    return Array.from((this.observers.get(name) || new Map()).values()).forEach(
      (fn) => fn(...args)
    );
  }

  /**
   * Destroys the provider instance
   */
  public destroy(): void {
    if (this.resync_interval !== 0) {
      clearInterval(this.resync_interval as number);
    }

    clearInterval(this.check_interval as unknown as number);
    this.disconnect();

    if (typeof window !== "undefined") {
      window.removeEventListener("unload", this.unload_handler);
    } else if (typeof process !== "undefined") {
      process.off("exit", this.unload_handler);
    }

    this.awareness.off("update", this.awareness_update_handler);
    this.doc.off("update", this.update_handler);
    this.observers = new Map();
  }

  /**
   * Connects to the broadcast channel
   */
  public connect_bc(): void {
    if (this.disable_bc) {
      return;
    }

    if (!this.bcconnected) {
      subscribe(this.bc_channel, this.bc_subscriber);
      this.bcconnected = true;
    }

    // Send sync step1 to the broadcast channel
    // Write sync step 1
    const encoder_sync = encoding.createEncoder();
    encoding.writeVarUint(encoder_sync, Message.SYNC);
    sync_protocol.writeSyncStep1(encoder_sync, this.doc);
    publish(this.bc_channel, encoding.toUint8Array(encoder_sync), this);

    // Broadcast the local state
    const encoder_state = encoding.createEncoder();
    encoding.writeVarUint(encoder_state, Message.SYNC);
    sync_protocol.writeSyncStep2(encoder_state, this.doc);
    publish(this.bc_channel, encoding.toUint8Array(encoder_state), this);

    // Write query awareness
    const encoder_awareness_query = encoding.createEncoder();
    encoding.writeVarUint(encoder_awareness_query, Message.QUERY_AWARENESS);
    publish(
      this.bc_channel,
      encoding.toUint8Array(encoder_awareness_query),
      this
    );

    // Broadcast the local awareness state
    const encoder_awareness_state = encoding.createEncoder();
    encoding.writeVarUint(encoder_awareness_state, Message.AWARENESS);
    encoding.writeVarUint8Array(
      encoder_awareness_state,
      awareness_protocol.encodeAwarenessUpdate(this.awareness, [
        this.doc.clientID
      ])
    );
    publish(
      this.bc_channel,
      encoding.toUint8Array(encoder_awareness_state),
      this
    );
  }

  /**
   * Diconnects from the broadcast channel
   */
  public disconnect_bc(): void {
    // Broadcast message with the local awareness state set to `null`
    // (indicating disconnect)
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, Message.AWARENESS);
    encoding.writeVarUint8Array(
      encoder,
      awareness_protocol.encodeAwarenessUpdate(
        this.awareness,
        [this.doc.clientID],
        new Map()
      )
    );
    broadcast_message(this, encoding.toUint8Array(encoder));

    if (this.bcconnected) {
      unsubscribe(this.bc_channel, this.bc_subscriber);
      this.bcconnected = false;
    }
  }

  /**
   * Disconnects the instance from the server
   */
  public disconnect(): void {
    this.should_connect = false;
    this.disconnect_bc();

    if (this.ws !== null) {
      this.ws.close();
    }
  }

  /**
   * Connects the instance to the server
   */
  public connect(): void {
    this.should_connect = true;
    if (!this.wsconnected && this.ws === null) {
      setup_ws(this);
      this.connect_bc();
    }
  }
}
