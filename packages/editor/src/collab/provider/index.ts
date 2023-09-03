import { WebsocketProvider } from "y-websocket";
import { Doc, RelativePosition } from "yjs";

export interface UserState {
  anchorPos: null | RelativePosition;
  avatarHex: string | null;
  avatarId: string | null;
  awarenessData: object;
  color: string;
  focusPos: null | RelativePosition;
  focusing: boolean;
  name: string;
  role: "editor" | "viewer";
  userId: string;
}

export type CollabLocalState = Omit<UserState, "anchorPos" | "focusPos"> & {
  provider: Provider;
};

export interface Operation {
  attributes: {
    __type: string;
  };
  insert: string | Record<string, unknown>;
}

export type Delta = Array<Operation>;
export type YjsNode = Record<string, unknown>;
export type YjsEvent = Record<string, unknown>;

export type ProviderAwareness = WebsocketProvider["awareness"];

export declare interface Provider {
  awareness: ProviderAwareness;
  connect(): void | Promise<void>;
  disconnect(): void;
  // OFF
  off(type: "sync", cb: (isSynced: boolean) => void): void;
  off(type: "synced", cb: (isSynced: boolean) => void): void;
  off(type: "update", cb: (arg0: unknown) => void): void;
  off(
    type: "status",
    cb: (arg0: { status: "connecting" | "connected" | "disconnected" }) => void
  ): void;
  off(type: "reload", cb: (doc: Doc) => void): void;
  off(type: "connection-error", cb: (event: Event) => void): void;
  off(type: "connection-close", cb: (event: Event) => void): void;
  // ON
  on(type: "sync", cb: (isSynced: boolean) => void): void;
  on(type: "synced", cb: (isSynced: boolean) => void): void;
  on(
    type: "status",
    cb: (arg0: { status: "connecting" | "connected" | "disconnected" }) => void
  ): void;
  on(type: "update", cb: (arg0: unknown) => void): void;
  on(type: "reload", cb: (doc: Doc) => void): void;
  on(type: "connection-error", cb: (event: Event) => void): void;
  on(type: "connection-close", cb: (event: Event) => void): void;
}

export const initLocalState = ({
  provider,
  ...rest
}: CollabLocalState): void => {
  provider.awareness.setLocalState({
    ...rest,
    anchorPos: null,
    focusPos: null
  });
};

export const setLocalStateFocus = ({
  provider,
  focusing,
  ...rest
}: CollabLocalState): void => {
  const { awareness } = provider;
  let localState = awareness.getLocalState();

  if (localState === null) {
    localState = {
      ...rest,
      focusing,
      anchorPos: null,
      focusPos: null
    };
  }

  localState.focusing = focusing;
  awareness.setLocalState(localState);
};
