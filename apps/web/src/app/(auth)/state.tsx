"use client";

import deepmerge from "deepmerge";
import { useSearchParams as use_search_params } from "next/navigation";
import React from "react";

import { FormError } from "~/utils/is-form-error";

import { LoginSchema } from "./auth/(segmented)/@login/schema";

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
  | "mfa"
  | `signup_${SignupSegment}`
  | `recovery_${RecoverySegment}`
  | `reset_${ResetSegment}`
  | "email_confirmation"
  | "suspended"
  | "deletion"
  | "deactivated";

type RecursivePartial<T> = {
  [P in keyof T]?: RecursivePartial<T[P]>;
};

type AuthState = {
  login_data: LoginSchema | null;
  mfa_code: string | null;
  next_url: string | null;
  recovery: {
    email: string;
  };
  reset_password: { token: null | string };
  segment: AuthSegment;
  signup: {
    email: string;
    name: string;
    password: string;
    username: string;
    wpm: null | number;
  };
  signup_errors: Partial<{
    base: FormError;
    username: FormError;
    wpm_manual: FormError;
  }>;
  // This is used for animations
  visited_segments: Array<AuthSegment>;
};

type AuthStateContextValue = {
  set_state: React.Dispatch<React.SetStateAction<RecursivePartial<AuthState>>>;
  state: AuthState;
};

const AuthStateContext = React.createContext<AuthStateContextValue>({
  state: {},
  set_state: () => undefined
} as unknown as AuthStateContextValue);

const AuthState = ({
  children
}: {
  children: React.ReactNode;
}): React.ReactElement => {
  const search_params = use_search_params();
  const segment = ((): AuthSegment => {
    if (search_params) {
      const segment = search_params.get("segment") || "";
      const token = search_params.get("token") || "";

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
  })();
  const [state, set_state] = React.useState<AuthState>({
    segment,
    visited_segments: [segment],
    next_url: ((): string | null => {
      if (!search_params) {
        return null;
      }

      const path = decodeURIComponent(search_params.get("to") || "");
      return path !== "/" ? path : null;
    })(),
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
  });

  return (
    <AuthStateContext.Provider
      value={{
        state,
        set_state: (payload): void => {
          set_state((prev_state) => {
            const next_state =
              typeof payload === "object" ? payload : payload(prev_state);

            if (next_state.segment) {
              if (next_state.segment === "base") {
                next_state.visited_segments = ["base"];
              } else if (prev_state.segment !== next_state.segment) {
                next_state.visited_segments = Array.from(
                  new Set([...prev_state.visited_segments, next_state.segment])
                );
              } else {
                const visited_segments = prev_state.visited_segments;

                if (visited_segments.length) {
                  next_state.visited_segments = visited_segments.filter(
                    (item) => item !== next_state.segment
                  );
                }
              }
            }

            return deepmerge(prev_state, next_state, {
              // eslint-disable-next-line prefer-snakecase/prefer-snakecase
              arrayMerge: (_, source_array) => source_array
            }) as AuthState;
          });
        }
      }}
    >
      {children}
    </AuthStateContext.Provider>
  );
};

export const use_auth_state = (): AuthStateContextValue =>
  React.useContext(AuthStateContext);

export default AuthState;
