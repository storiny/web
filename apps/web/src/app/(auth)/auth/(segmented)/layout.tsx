"use client";

import { useSearchParams } from "next/navigation";
import React from "react";

import { useAuthState } from "../../actions";
import { AuthSegment } from "../../state";

/**
 * Switches parallel segments based on the state
 */
const SegmentedLayout = (
  props: Record<AuthSegment, React.ReactNode>
): React.ReactNode => {
  const params = useSearchParams();
  const { state, actions } = useAuthState();
  const segment = params.get("segment") || "";
  const token = params.get("token") || "";

  if (segment === "reset-password" && token) {
    actions.setResetPasswordToken(token);
    return props.reset_base;
  }

  if (["login", "signup"].includes(segment)) {
    return segment === "login" ? props.login : props.signup_base;
  }

  return props[state.auth.segment];
};

export default SegmentedLayout;
