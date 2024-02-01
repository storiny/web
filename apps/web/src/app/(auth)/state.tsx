"use client";

import { clsx } from "clsx";
import {
  createStore as create_store,
  StateMachineProvider
} from "little-state-machine";
import React from "react";

import NoSsr from "~/components/no-ssr";
import Spinner from "~/components/spinner";
import css from "~/theme/main.module.scss";

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

const get_segment = (): AuthSegment => {
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    const segment = params.get("segment") || "";
    const token = params.get("token") || "";

    if (["reset-password", "login", "signup", "recover"].includes(segment)) {
      if (segment === "reset-password" && token) {
        return "reset_base";
      }

      if (["login", "signup", "recover"].includes(segment)) {
        return segment === "login"
          ? "login"
          : segment === "recover"
            ? "recovery_base"
            : "signup_base";
      }
    }
  }

  return "base";
};

create_store(
  {
    auth: {
      segment: get_segment()
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
  <NoSsr
    fallback={
      <div className={clsx(css["flex-center"], css["full-w"], css["full-h"])}>
        <Spinner size={"lg"} />
      </div>
    }
  >
    <StateMachineProvider>{children}</StateMachineProvider>
  </NoSsr>
);

export default AuthState;
