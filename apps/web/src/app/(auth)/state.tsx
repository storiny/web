"use client";

import {
  createStore as create_store,
  StateMachineProvider
} from "little-state-machine";
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
  | "deletion"
  | "deactivated";

create_store(
  {
    auth: {
      segment: "base"
    },
    reset_password: { token: null },
    login_data: null,
    mfa_code: null,
    recovery: {
      email: ""
    },
    signup: {
      email: "",
      name: "",
      password: "",
      username: "",
      wpm: null
    },
    signup_errors: {}
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
