import "server-only";

import { TokenType } from "@storiny/shared";
import React from "react";

import { getToken, verifyEmail } from "~/common/grpc";
import { handleException } from "~/common/grpc/utils";

import VerifyEmailInvalidToken from "../invalid-token";
import VerifyEmailSuccess from "../success";

const Page = async ({
  params: { token }
}: {
  params: { token: string };
}): Promise<React.ReactElement | undefined> => {
  try {
    const tokenResponse = await getToken({
      identifier: token,
      type: TokenType.EMAIL_VERIFICATION
    });

    if (tokenResponse.is_valid) {
      try {
        await verifyEmail({
          identifier: token
        });

        return <VerifyEmailSuccess />;
      } catch (e) {
        handleException(e);
      }
    }

    return <VerifyEmailInvalidToken />;
  } catch (e) {
    handleException(e);
  }
};

export * from "./metadata";
export default Page;
