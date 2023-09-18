import { RelativePosition } from "yjs";

import { WebsocketProvider } from "../websocket";

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

export declare interface Provider extends WebsocketProvider {}

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
