import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import React from "react";

import { getUser } from "~/common/utils/getUser";

/**
 * Redirects to the login page if the user is logged out.
 */
const CheckUserLayout = async ({
  children
}: {
  children: React.ReactNode;
}): Promise<React.ReactElement> => {
  const nextUrl = headers().get("next-url") || "/";
  const userId = await getUser();

  if (!userId) {
    const to = nextUrl === "/" ? "" : `?to=${encodeURIComponent(nextUrl)}`;
    redirect(`/login${to}`);
  }

  return <React.Fragment>{children}</React.Fragment>;
};

export default CheckUserLayout;
