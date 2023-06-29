"use client";

import { GlobalState, useStateMachine } from "little-state-machine";

import { AuthSegment } from "./state";

type AnyCallback<Payload = any> = (
  state: GlobalState,
  payload: Payload
) => GlobalState;

type StateActions = {
  setRecoveryState: <T extends keyof GlobalState["recovery"]>(
    state: GlobalState,
    payload: Record<T, GlobalState["recovery"][T]>
  ) => GlobalState;
  setResetPasswordToken: AnyCallback<string>;
  setSignupState: <T extends keyof GlobalState["signup"]>(
    state: GlobalState,
    payload: Record<T, GlobalState["signup"][T]>
  ) => GlobalState;
  switchSegment: AnyCallback<AuthSegment>;
};

/**
 * Switches to a new segment
 * @param state Global state
 * @param payload Segment payload
 */
export const switchSegment: StateActions["switchSegment"] = (
  state,
  payload
) => ({
  ...state,
  auth: {
    ...state.auth,
    segment: payload,
  },
});

/**
 * Updates signup state
 * @param state Global state
 * @param payload Key-value pair of signup data to update
 */
export const setSignupState: StateActions["setSignupState"] = (
  state,
  payload
) => ({
  ...state,
  signup: {
    ...state.signup,
    ...payload,
  },
});

/**
 * Updates recovery state
 * @param state Global state
 * @param payload Key-value pair of recovery data to update
 */
export const setRecoveryState: StateActions["setRecoveryState"] = (
  state,
  payload
) => ({
  ...state,
  recovery: {
    ...state.recovery,
    ...payload,
  },
});

/**
 * Updates token for password reset logic
 * @param state Global state
 * @param payload Token
 */
export const setResetPasswordToken: StateActions["setResetPasswordToken"] = (
  state,
  payload
) => ({
  ...state,
  resetPassword: {
    ...state.resetPassword,
    token: payload,
  },
});

/**
 * Extended version of `useStateMachine` with actions
 */
export const useAuthState = (): ReturnType<typeof useStateMachine> =>
  useStateMachine<AnyCallback, StateActions>({
    switchSegment,
    setSignupState,
    setRecoveryState,
    setResetPasswordToken,
  });
