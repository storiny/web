import "server-only";

import React from "react";

import { getUser } from "~/common/utils/getUser";

import CheckUserClient from "./client";

/**
 * Redirects to the login page if the user is logged out.
 */
const CheckUserLayout = async ({
  children
}: {
  children: React.ReactNode;
}): Promise<React.ReactElement> => {
  const userId = await getUser();
  return <CheckUserClient userId={userId}>{children}</CheckUserClient>;
};

export default CheckUserLayout;
