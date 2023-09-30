import "server-only";

import { TokenType } from "@storiny/shared";
import { redirect } from "next/navigation";
import React from "react";

import { get_token } from "~/common/grpc";
import { handle_exception } from "~/common/grpc/utils";

import ResetInvalidToken from "../invalid-token";
import ResetTokenExpired from "../token-expired";

const Page = async ({
  params: { token }
}: {
  params: { token: string };
}): Promise<React.ReactElement | undefined> => {
  try {
    const token_response = await get_token({
      identifier: token,
      type: TokenType.PASSWORD_RESET
    });

    if (token_response.is_valid) {
      return redirect(`/auth?segment=reset-password&token=${token}`);
    }

    if (token_response.is_expired) {
      return <ResetTokenExpired />;
    }

    return <ResetInvalidToken />;
  } catch (e) {
    handle_exception(e);
  }
};

export * from "./metadata";
export default Page;
