import "server-only";

import { redirect } from "next/navigation";
import React from "react";

import { getLoginActivity } from "~/common/grpc";
import { handleException } from "~/common/grpc/utils";
import { getSessionToken } from "~/common/utils/getSessionToken";
import { getUser } from "~/common/utils/getUser";

import LoginActivityClient from "./client";

const Page = async (): Promise<React.ReactElement | undefined> => {
  try {
    const sessionToken = getSessionToken();

    if (!sessionToken) {
      redirect("/login"); // Early return
    }

    const userId = await getUser();

    if (!userId) {
      redirect("/login");
    }

    const loginActivityResponse = await getLoginActivity({
      token: sessionToken
    });

    return <LoginActivityClient {...loginActivityResponse} />;
  } catch (e) {
    handleException(e);
  }
};

export * from "./metadata";
export default Page;
