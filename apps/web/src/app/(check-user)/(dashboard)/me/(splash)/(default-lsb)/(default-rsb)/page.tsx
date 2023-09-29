"use client";

import { redirect } from "next/navigation";
import React from "react";

import { use_media_query } from "../../../../../../../../../../packages/ui/src/hooks/use-media-query";
import { BREAKPOINTS } from "~/theme/breakpoints";

import DashboardNavigationScreen from "./navigation-screen";

const Page = ({
  disableRedirect
}: {
  disableRedirect?: boolean;
}): React.ReactElement => {
  const shouldRedirect = use_media_query(BREAKPOINTS.up("desktop"));

  // Redirect if sidebars are visible
  if (shouldRedirect && !disableRedirect) {
    redirect("/me/account/profile");
  }

  return <DashboardNavigationScreen />;
};

export default Page;
