"use client";

import { useSearchParams } from "next/navigation";
import React from "react";

import { use_auth_state } from "../../actions";
import { AuthSegment } from "../../state";

/**
 * Switches parallel segments based on the state
 */
const SegmentedLayout = (
  props: Record<AuthSegment, React.ReactNode>
): React.ReactNode => {
  const params = useSearchParams();
  const { state, actions } = use_auth_state();
  const segment = params.get("segment") || "";
  const token = params.get("token") || "";

  if (segment === "reset-password" && token) {
    actions.set_reset_password_token(token);
    return props.reset_base;
  }

  if (["login", "signup", "recover"].includes(segment)) {
    return segment === "login"
      ? props.login
      : segment === "recover"
      ? props.recovery_base
      : props.signup_base;
  }

  return props[state.auth.segment];
};

export default SegmentedLayout;
