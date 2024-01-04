"use client";

import React from "react";

import { use_auth_state } from "../../actions";
import { AuthSegment } from "../../state";

/**
 * Switches parallel segments based on the state
 */
const SegmentedLayout = (
  props: Record<AuthSegment, React.ReactNode>
): React.ReactNode => {
  const { state } = use_auth_state();

  React.useEffect(() => {
    // Remove the search parameters.
    window.history.replaceState({}, "", "/auth");
  }, []);

  return props[state.auth.segment];
};

export default SegmentedLayout;
