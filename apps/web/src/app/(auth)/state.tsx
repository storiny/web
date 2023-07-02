"use client";

import { createStore, StateMachineProvider } from "little-state-machine";
import React from "react";

type SignupSegment =
  | "base"
  | "username"
  | "wpm_base"
  | "wpm_confirmation"
  | "wpm_manual"
  | "wpm_auto"
  | "email_confirmation";
type RecoverySegment = "base" | "inbox";
type ResetSegment = "base" | "success";

export type AuthSegment =
  | "base"
  | "login"
  | `signup_${SignupSegment}`
  | `recovery_${RecoverySegment}`
  | `reset_${ResetSegment}`
  | "suspended"
  | "deletion";

createStore(
  {
    auth: {
      segment: "base"
    },
    resetPassword: { token: null },
    recovery: {
      email: ""
    },
    signup: {
      email: "",
      name: "",
      password: "",
      username: "",
      wpm: null
    }
  },
  {
    persist: "none"
  }
);

const AuthState = ({
  children
}: {
  children: React.ReactNode;
}): React.ReactElement => (
  <StateMachineProvider>{children}</StateMachineProvider>
);

export default AuthState;
