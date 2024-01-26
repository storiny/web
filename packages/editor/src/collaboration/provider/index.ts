import { DocUserRole } from "@storiny/types";
import { RelativePosition } from "yjs";

import { WebsocketProvider } from "../websocket";

export interface UserState {
  anchor_pos: null | RelativePosition;
  avatar_hex: string | null;
  avatar_id: string | null;
  awareness_data: object;
  color: string;
  focus_pos: null | RelativePosition;
  focusing: boolean;
  name: string;
  role: DocUserRole;
  user_id: string;
}

export type CollabLocalState = Omit<UserState, "anchor_pos" | "focus_pos"> & {
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

export declare type Provider = WebsocketProvider;

/**
 * Initializes the local client state
 * @param provider Provider
 * @param rest Local state
 */
export const init_local_state = ({
  provider,
  ...rest
}: CollabLocalState): void => {
  provider.awareness.setLocalState({
    ...rest,
    anchor_pos: null,
    focus_pos: null
  });
};

/**
 * Sets the focus props on the local client state
 * @param provider Provider
 * @param focusing Focusing boolean flag
 * @param rest Local state
 */
export const set_local_state_focus = ({
  provider,
  focusing,
  ...rest
}: CollabLocalState): void => {
  const { awareness } = provider;
  let local_state = awareness.getLocalState();

  if (local_state === null) {
    local_state = {
      ...rest,
      focusing,
      anchor_pos: null,
      focus_pos: null
    };
  }

  local_state.focusing = focusing;
  awareness.setLocalState(local_state);
};
