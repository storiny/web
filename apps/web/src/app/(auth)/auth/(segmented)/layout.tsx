"use client";

import { useSearchParams as use_search_params } from "next/navigation";
import React from "react";

import { use_auth_state } from "../../actions";
import { AuthSegment } from "../../state";

/**
 * Switches parallel segments based on the state
 */
const SegmentedLayout = (
  props: Record<AuthSegment, React.ReactNode>
): React.ReactNode => {
  const params = use_search_params();
  const { state } = use_auth_state();
  // TODO: clean after alpha
  const segment = params.get("segment") || "";
  const token = params.get("token") || "";

  React.useEffect(() => {
    // Remove the search parameters.
    window.history.replaceState({}, "", "/auth");
  }, []);

  if (segment === "reset-password" && token) {
    return props.reset_base;
  }

  // TODO: Uncomment after alpha
  // if (["login", "signup", "recover"].includes(segment)) {
  //   return segment === "login"
  //     ? props.login
  //     : segment === "recover"
  //     ? props.recovery_base
  //     : props.signup_base;
  // }

  if (["login", "recover"].includes(segment)) {
    return segment === "login" ? props.login : props.recovery_base;
  }

  return props[state.auth.segment];
};

export default SegmentedLayout;
