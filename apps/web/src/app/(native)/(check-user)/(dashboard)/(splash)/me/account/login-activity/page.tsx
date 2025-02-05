import "server-only";

import { redirect } from "next/navigation";
import React from "react";

import { get_login_activity } from "~/common/grpc";
import { handle_exception } from "~/common/grpc/utils";
import { get_session_token } from "~/common/utils/get-session-token";
import { get_user } from "~/common/utils/get-user";

import LoginActivityClient from "./client";

const Page = async (): Promise<React.ReactElement | undefined> => {
  try {
    const session_token = await get_session_token();

    if (!session_token) {
      redirect(`/login?to=${encodeURIComponent("/me/account/login-activity")}`);
    }

    const user_id = await get_user();

    if (!user_id) {
      redirect(`/login?to=${encodeURIComponent("/me/account/login-activity")}`);
    }

    const login_activity_response = await get_login_activity({
      token: session_token,
      user_id
    });

    return <LoginActivityClient {...login_activity_response} />;
  } catch (e) {
    handle_exception(e);
  }
};

export { metadata } from "./metadata";
export default Page;
