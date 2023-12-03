"use client";

import {
  GlobalState,
  useStateMachine as use_state_machine
} from "little-state-machine";

import { LoginSchema } from "./auth/(segmented)/@login/schema";
import { AuthSegment } from "./state";

type AnyCallback<Payload = any> = (
  state: GlobalState,
  payload: Payload
) => GlobalState;

type StateActions = {
  set_login_data: (state: GlobalState, payload: LoginSchema) => GlobalState;
  set_recovery_state: <T extends keyof GlobalState["recovery"]>(
    state: GlobalState,
    payload: Record<T, GlobalState["recovery"][T]>
  ) => GlobalState;
  set_reset_password_token: AnyCallback<string>;
  set_signup_state: <T extends keyof GlobalState["signup"]>(
    state: GlobalState,
    payload: Record<T, GlobalState["signup"][T]>
  ) => GlobalState;
  switch_segment: AnyCallback<AuthSegment>;
};

/**
 * Switches to a new segment
 * @param state Global state
 * @param payload Segment payload
 */
export const switch_segment: StateActions["switch_segment"] = (
  state,
  payload
) => ({
  ...state,
  auth: {
    ...state.auth,
    segment: payload
  }
});

/**
 * Updates signup state
 * @param state Global state
 * @param payload Key-value pair of signup data to update
 */
export const set_signup_state: StateActions["set_signup_state"] = (
  state,
  payload
) => ({
  ...state,
  signup: {
    ...state.signup,
    ...payload
  }
});

/**
 * Updates the login data
 * @param state Global state
 * @param payload The login data
 */
export const set_login_data: StateActions["set_login_data"] = (
  state,
  payload
) => ({
  ...state,
  login_data: {
    ...state.login_data,
    ...payload
  }
});

/**
 * Updates recovery state
 * @param state Global state
 * @param payload Key-value pair of recovery data to update
 */
export const set_recovery_state: StateActions["set_recovery_state"] = (
  state,
  payload
) => ({
  ...state,
  recovery: {
    ...state.recovery,
    ...payload
  }
});

/**
 * Updates token for password reset logic
 * @param state Global state
 * @param payload Token
 */
export const set_reset_password_token: StateActions["set_reset_password_token"] =
  (state, payload) => ({
    ...state,
    reset_password: {
      ...state.reset_password,
      token: payload
    }
  });

/**
 * Extended version of `useStateMachine` with actions
 */
export const use_auth_state = (): ReturnType<typeof use_state_machine> =>
  use_state_machine<AnyCallback, StateActions>({
    switch_segment,
    set_login_data,
    set_signup_state,
    set_recovery_state,
    set_reset_password_token
  });
