import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { act } from "@testing-library/react";
import { EditorState, LexicalEditor } from "lexical";
import React from "react";
import * as Y from "yjs";

import { render_test_with_provider } from "../../../../ui/src/redux/test-utils";

import { Provider, UserState } from "../../../src/collaboration/provider";
import EditorComposer from "../../../src/components/composer";
import EditorContentEditable from "../../../src/components/content-editable";
import EditorErrorBoundary from "../../../src/components/error-boundary";
import CollaborationPlugin from "../../../src/plugins/collaboration";
import { useCollaborationContext } from "../../../src/plugins/collaboration/context";
import RichTextPlugin from "../../../src/plugins/rich-text";

type Connection = {
  clients: Map<string, Client>;
};

const Editor = ({
  doc,
  provider,
  setEditor,
  awarenessData
}: {
  awarenessData: object;
  doc: Y.Doc;
  provider: Client;
  setEditor: (editor: LexicalEditor) => void;
}): React.ReactElement => {
  const context = useCollaborationContext({});
  const [editor] = useLexicalComposerContext();
  const { yjsDocMap } = context;

  context.isCollabActive = true;
  yjsDocMap.set("main", doc);

  setEditor(editor);

  return (
    <>
      <CollaborationPlugin
        awarenessData={awarenessData}
        id="test"
        providerFactory={(): Provider => provider as unknown as Provider}
        role={"editor"}
        shouldBootstrap={true}
      />
      <RichTextPlugin
        ErrorBoundary={EditorErrorBoundary}
        contentEditable={<EditorContentEditable />}
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
    this.awarenessState = null;

    this.listeners = new Map();
    this.updates = [];
    this.editor = null;

    this.onUpdate = this.onUpdate.bind(this);
    this.doc.on("update", this.onUpdate);

    this.awareness = {
      getLocalState(this: Client): UserState | null {
        return this.awarenessState;
      },
      getStates(this: Client): Map<number, UserState> {
        const states: Map<number, UserState> = new Map();
        states.set(0, this.awarenessState as UserState);
        return states;
      },
      off(): void {
        // TODO
      },
      on(): void {
        // TODO
      },
      setLocalState(this: Client, state: UserState): void {
        this.awarenessState = state;
      }
    };
  }

  /**
   * Awareness object
   */
  public awareness: {
    getLocalState: () => UserState | null;
    getStates: () => Map<number, UserState>;
    off(): void;
    on(): void;
    setLocalState: (state: UserState) => void;
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
  private awarenessState: UserState | null;
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

      this.broadcastUpdate(update);
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
   * @param rootContainer Root container element
   * @param awarenessData Awareness data for the client
   */
  public start(
    rootContainer: HTMLDivElement | null,
    awarenessData: object = {}
  ): void {
    const container = document.createElement("div");
    this.container = container;
    rootContainer?.appendChild(container);

    render_test_with_provider(
      <EditorComposer ignoreNodes ignoreTheme>
        <Editor
          awarenessData={awarenessData}
          doc={this.doc}
          provider={this}
          setEditor={(editor): LexicalEditor => (this.editor = editor)}
        />
      </EditorComposer>,
      { loggedIn: true, ignorePrimitiveProviders: true, container }
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
    let listenerSet = this.listeners.get(type);

    if (listenerSet === undefined) {
      listenerSet = new Set();
      this.listeners.set(type, listenerSet);
    }

    listenerSet.add(callback);
  }

  /**
   * Removes a listener from the map
   * @param type Type of the event
   * @param callback Callback
   */
  public off(type: string, callback: () => void): void {
    const listenerSet = this.listeners.get(type);

    if (listenerSet !== undefined) {
      listenerSet.delete(callback);
    }
  }

  /**
   * Returns the HTML content of the editor
   */
  public getHTML(): string {
    return (this.container?.firstChild as HTMLElement)?.innerHTML || "";
  }

  /**
   * Returns the JSON data of the document
   */
  public getDocJSON(): { [p: string]: any } {
    return this.doc.toJSON();
  }

  /**
   * Returns the editor state
   */
  public getEditorState(): EditorState | undefined {
    return this.editor?.getEditorState();
  }

  /**
   * Returns the editor instance
   */
  public getEditor(): LexicalEditor | null {
    return this.editor;
  }

  /**
   * Returns the container element
   */
  public getContainer(): HTMLDivElement | null {
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
  private onUpdate(update: Uint8Array, origin: Connection): void {
    if (origin !== this.connection && this.connected) {
      this.broadcastUpdate(update);
    }
  }

  /**
   * Applies an update to the document
   * @param update Update data
   * @private
   */
  private broadcastUpdate(update: Uint8Array): void {
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
    const listenerSet = this.listeners.get(type);

    if (listenerSet !== undefined) {
      listenerSet.forEach((callback) => callback(data));
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
  public createClient(id: string): Client {
    const client = new Client(id, this);
    this.clients.set(id, client);
    return client;
  }
}

/**
 * Creates a new test connection
 */
export const createTestConnection = (): TestConnection => new TestConnection();

/**
 * Waits for React to finish applying updates
 * @param callback Callback
 */
export const waitForReact = async (callback: () => void): Promise<void> => {
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
export const createAndStartClients = (
  connector: TestConnection,
  container: HTMLDivElement | null,
  count: number
): Array<Client> => {
  const result = [];

  for (let i = 0; i < count; ++i) {
    const id = `${i}`;
    const client = connector.createClient(id);
    client.start(container);
    result.push(client);
  }

  return result;
};

/**
 * Disconnects the provided clients
 * @param clients Clients to disconnect
 */
export const disconnectClients = (clients: Array<Client>): void => {
  for (let i = 0; i < clients.length; ++i) {
    clients[i].disconnect();
  }
};

/**
 * Connects the provided clients
 * @param clients Clients to connect
 */
export const connectClients = (clients: Array<Client>): void => {
  for (let i = 0; i < clients.length; ++i) {
    clients[i].connect();
  }
};

/**
 * Stops the provided clients
 * @param clients Clients to stop
 */
export const stopClients = (clients: Array<Client>): void => {
  for (let i = 0; i < clients.length; ++i) {
    clients[i].stop();
  }
};

/**
 * Asserts whether the provided clients share identical documents
 * @param clients Clients
 */
export const testClientsForEquality = (clients: Array<Client>): void => {
  for (let i = 1; i < clients.length; ++i) {
    expect(clients[0].getHTML()).toEqual(clients[i].getHTML());
    expect(clients[0].getDocJSON()).toEqual(clients[i].getDocJSON());
  }
};
