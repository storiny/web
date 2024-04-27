import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import React from "react";

import { get_user } from "~/common/utils/get-user";

/**
 * Redirects to the login page if the user is logged out.
 */
const CheckUserLayout = async ({
  children
}: {
  children: React.ReactNode;
}): Promise<React.ReactElement> => {
  const pathname = headers().get("x-pathname") || "/";
  const user_id = await get_user();

  if (!user_id) {
    const to = pathname === "/" ? "" : `?to=${encodeURIComponent(pathname)}`;
    redirect(`/login${to}`);
  }

  return <React.Fragment>{children}</React.Fragment>;
};

export default CheckUserLayout;
