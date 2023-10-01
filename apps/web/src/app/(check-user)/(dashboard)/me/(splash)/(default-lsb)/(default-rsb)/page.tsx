"use client";

import { redirect } from "next/navigation";
import React from "react";

import { use_media_query } from "~/hooks/use-media-query";
import { BREAKPOINTS } from "~/theme/breakpoints";

import DashboardNavigationScreen from "./navigation-screen";

const Page = ({
  disable_redirect
}: {
  disable_redirect?: boolean;
}): React.ReactElement => {
  const should_redirect = use_media_query(BREAKPOINTS.up("desktop"));

  // Redirect if sidebars are visible
  if (should_redirect && !disable_redirect) {
    redirect("/me/account/profile");
  }

  return <DashboardNavigationScreen />;
};

export default Page;
