import "server-only";

import { TokenType } from "@storiny/shared";
import { redirect } from "next/navigation";
import React from "react";

import { getToken } from "~/common/grpc";
import { handleException } from "~/common/grpc/utils";

import ResetInvalidToken from "../invalid-token";
import ResetTokenExpired from "../token-expired";

const Page = async ({
  params: { token }
}: {
  params: { token: string };
}): Promise<React.ReactElement | undefined> => {
  try {
    const tokenResponse = await getToken({
      identifier: token,
      type: TokenType.PASSWORD_RESET
    });

    if (tokenResponse.is_valid) {
      return redirect(`/auth?segment=reset-password&token=${token}`);
    }

    if (tokenResponse.is_expired) {
      return <ResetTokenExpired />;
    }

    return <ResetInvalidToken />;
  } catch (e) {
    handleException(e);
  }
};

export * from "./metadata";
export default Page;
