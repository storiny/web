import { useLexicalComposerContext as use_lexical_composer_context } from "@lexical/react/LexicalComposerContext";
import { act } from "@testing-library/react";
import { EditorState, LexicalEditor } from "lexical";
import React from "react";
import * as Y from "yjs";

import { render_test_with_provider } from "~/redux/test-utils";

import { Provider, UserState } from "../../../src/collaboration/provider";
import EditorComposer from "../../../src/components/composer";
import EditorContentEditable from "../../../src/components/content-editable";
import EditorErrorBoundary from "../../../src/components/error-boundary";
import CollaborationPlugin from "../../../src/plugins/collaboration";
import { use_collaboration_context } from "../../../src/plugins/collaboration/context";
import RichTextPlugin from "../../../src/plugins/rich-text";

type Connection = {
  clients: Map<string, Client>;
};

const Editor = ({
  doc,
  provider,
  set_editor,
  awareness_data
}: {
  awareness_data: object;
  doc: Y.Doc;
  provider: Client;
  set_editor: (editor: LexicalEditor) => void;
}): React.ReactElement => {
  const context = use_collaboration_context({});
  const [editor] = use_lexical_composer_context();
  const { yjs_doc_map } = context;

  context.is_collab_active = true;
  yjs_doc_map.set("main", doc);

  set_editor(editor);

  return (
    <>
      <CollaborationPlugin
        awareness_data={awareness_data}
        id="test"
        provider_factory={(): Provider => provider as unknown as Provider}
        role={"editor"}
        should_bootstrap={true}
      />
      <RichTextPlugin
        ErrorBoundary={EditorErrorBoundary}
        content_editable={<EditorContentEditable />}
        placeholder={<></>}
      />
    </>
  );
};

export class Client {
  /**
   * Ctor
   * @param id Client ID
   * @param connection Connection
   */
  constructor(
    id: string,
    connection: {
      clients: Map<string, Client>;
    }
  ) {
    this.id = id;
    this.container = null;
    this.connection = connection;
    this.connected = false;
    this.doc = new Y.Doc();
    this.awareness_state = null;

    this.listeners = new Map();
    this.updates = [];
    this.editor = null;

    this.on_update = this.on_update.bind(this);
    this.doc.on("update", this.on_update);

    this.awareness = {
      /* eslint-disable prefer-snakecase/prefer-snakecase */
      getLocalState(this: Client): UserState | null {
        return this.awareness_state;
      },
      getStates(this: Client): Map<number, UserState> {
        const states: Map<number, UserState> = new Map();
        states.set(0, this.awareness_state as UserState);
        return states;
      },
      off(): void {
        // TODO
      },
      on(): void {
        // TODO
      },
      setLocalState(this: Client, state: UserState): void {
        this.awareness_state = state;
      }
      /* eslint-enable prefer-snakecase/prefer-snakecase */
    };
  }

  /**
   * Awareness object
   */
  public awareness: {
    /* eslint-disable prefer-snakecase/prefer-snakecase */
    getLocalState: () => UserState | null;
    getStates: () => Map<number, UserState>;
    off(): void;
    on(): void;
    setLocalState: (state: UserState) => void;
    /* eslint-enable prefer-snakecase/prefer-snakecase */
  };
  /**
   * ID of the client
   * @private
   */
  private readonly id: string;
  /**
   * Editor container element
   * @private
   */
  private container: HTMLDivElement | null;
  /**
   * Editor instance
   * @private
   */
  private editor: LexicalEditor | null;
  /**
   * Connection object
   * @private
   */
  private readonly connection: Connection;
  /**
   * Connected flag (whether the client is connected)
   * @private
   */
  private connected: boolean;
  /**
   * Document for the client
   * @private
   */
  private readonly doc: Y.Doc;
  /**
   * Client awareness state
   * @private
   */
  private awareness_state: UserState | null;
  /**
   * Client listeners
   * @private
   */
  private listeners: Map<string, Set<(data: unknown) => void>>;
  /**
   * Pending updates
   * @private
   */
  private updates: Uint8Array[];

  /**
   * Initializes the connection
   */
  public connect(): void {
    if (!this.connected) {
      this.connected = true;
      const update = Y.encodeStateAsUpdate(this.doc);

      if (this.updates.length > 0) {
        Y.applyUpdate(this.doc, Y.mergeUpdates(this.updates), this.connection);
        this.updates = [];
      }

      this.broadcast_update(update);
      this.dispatch("sync", true);
    }
  }

  /**
   * Destroys the connection
   */
  public disconnect(): void {
    this.connected = false;
  }

  /**
   * Renders the editor
   * @param root_container Root container element
   * @param awareness_data Awareness data for the client
   */
  public start(
    root_container: HTMLDivElement | null,
    awareness_data: object = {}
  ): void {
    const container = document.createElement("div");
    this.container = container;
    root_container?.appendChild(container);

    render_test_with_provider(
      <EditorComposer ignore_nodes ignore_theme>
        <Editor
          awareness_data={awareness_data}
          doc={this.doc}
          provider={this}
          set_editor={(editor): LexicalEditor => (this.editor = editor)}
        />
      </EditorComposer>,
      { logged_in: true, ignore_primitive_providers: true, container }
    );
  }

  /**
   * Stops rendering the editor
   */
  public stop(): void {
    this.container?.parentNode?.removeChild(this.container);
    this.container = null;
  }

  /**
   * Adds a new listeners to the map
   * @param type Type of the event
   * @param callback Callback
   */
  public on(type: string, callback: () => void): void {
    let listener_set = this.listeners.get(type);

    if (listener_set === undefined) {
      listener_set = new Set();
      this.listeners.set(type, listener_set);
    }

    listener_set.add(callback);
  }

  /**
   * Removes a listener from the map
   * @param type Type of the event
   * @param callback Callback
   */
  public off(type: string, callback: () => void): void {
    const listener_set = this.listeners.get(type);
    if (listener_set !== undefined) {
      listener_set.delete(callback);
    }
  }

  /**
   * Returns the HTML content of the editor
   */
  public get_html(): string {
    return (this.container?.firstChild as HTMLElement)?.innerHTML || "";
  }

  /**
   * Returns the JSON data of the document
   */
  public get_doc_json(): { [p: string]: any } {
    return this.doc.toJSON();
  }

  /**
   * Returns the editor state
   */
  public get_editor_state(): EditorState | undefined {
    return this.editor?.getEditorState();
  }

  /**
   * Returns the editor instance
   */
  public get_editor(): LexicalEditor | null {
    return this.editor;
  }

  /**
   * Returns the container element
   */
  public get_container(): HTMLDivElement | null {
    return this.container;
  }

  /**
   * Focuses the container
   */
  public async focus(): Promise<void> {
    this.container?.focus();
    await Promise.resolve().then();
  }

  /**
   * Updates the editor using the provided callback
   * @param callback Update callback
   */
  public update(callback: Parameters<LexicalEditor["update"]>[0]): void {
    this.editor?.update(callback);
  }

  /**
   * Update handler
   * @param update Update data
   * @param origin Origin of the upadte
   * @private
   */
  private on_update(update: Uint8Array, origin: Connection): void {
    if (origin !== this.connection && this.connected) {
      this.broadcast_update(update);
    }
  }

  /**
   * Applies an update to the document
   * @param update Update data
   * @private
   */
  private broadcast_update(update: Uint8Array): void {
    this.connection.clients.forEach((client) => {
      if (client !== this) {
        if (client.connected) {
          Y.applyUpdate(client.doc, update, this.connection);
        } else {
          client.updates.push(update);
        }
      }
    });
  }

  /**
   * Dispatches an event
   * @param type Event type
   * @param data Event data
   * @private
   */
  private dispatch(type: string, data: unknown): void {
    const listener_set = this.listeners.get(type);
    if (listener_set !== undefined) {
      listener_set.forEach((callback) => callback(data));
    }
  }
}

class TestConnection {
  /**
   * Ctor
   */
  constructor() {
    this.clients = new Map();
  }

  /**
   * Client map
   */
  public clients: Map<string, Client>;

  /**
   * Creates a new client
   * @param id Client ID
   */
  public create_client(id: string): Client {
    const client = new Client(id, this);
    this.clients.set(id, client);
    return client;
  }
}

/**
 * Creates a new test connection
 */
export const create_test_connection = (): TestConnection =>
  new TestConnection();

/**
 * Waits for React to finish applying updates
 * @param callback Callback
 */
export const wait_for_react = async (callback: () => void): Promise<void> => {
  await act(async () => {
    callback();
    await Promise.resolve().then();
  });
};

/**
 * Creates and starts `count` number of clients
 * @param connector Test connection instance
 * @param container Editor container element
 * @param count Number of clients to create
 */
export const create_and_start_clients = (
  connector: TestConnection,
  container: HTMLDivElement | null,
  count: number
): Array<Client> => {
  const result = [];

  for (let i = 0; i < count; ++i) {
    const id = `${i}`;
    const client = connector.create_client(id);
    client.start(container);
    result.push(client);
  }

  return result;
};

/**
 * Disconnects the provided clients
 * @param clients Clients to disconnect
 */
export const disconnect_clients = (clients: Array<Client>): void => {
  for (let i = 0; i < clients.length; ++i) {
    clients[i].disconnect();
  }
};

/**
 * Connects the provided clients
 * @param clients Clients to connect
 */
export const connect_clients = (clients: Array<Client>): void => {
  for (let i = 0; i < clients.length; ++i) {
    clients[i].connect();
  }
};

/**
 * Stops the provided clients
 * @param clients Clients to stop
 */
export const stop_clients = (clients: Array<Client>): void => {
  for (let i = 0; i < clients.length; ++i) {
    clients[i].stop();
  }
};

/**
 * Asserts whether the provided clients share identical documents
 * @param clients Clients
 */
export const test_clients_for_equality = (clients: Array<Client>): void => {
  for (let i = 1; i < clients.length; ++i) {
    expect(clients[0].get_html()).toEqual(clients[i].get_html());
    expect(clients[0].get_doc_json()).toEqual(clients[i].get_doc_json());
  }
};
