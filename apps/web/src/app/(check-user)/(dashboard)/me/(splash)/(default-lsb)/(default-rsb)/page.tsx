"use client";

import { redirect } from "next/navigation";
import React from "react";

import { useMediaQuery } from "~/hooks/useMediaQuery";
import { breakpoints } from "~/theme/breakpoints";

import DashboardNavigationScreen from "./navigation-screen";

const Page = ({
  disableRedirect
}: {
  disableRedirect?: boolean;
}): React.ReactElement => {
  const shouldRedirect = useMediaQuery(breakpoints.up("desktop"));

  // Redirect if sidebars are visible
  if (shouldRedirect && !disableRedirect) {
    redirect("/me/account/profile");
  }

  return <DashboardNavigationScreen />;
};

export default Page;
