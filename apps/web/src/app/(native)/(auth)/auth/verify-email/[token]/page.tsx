import "server-only";

import { TokenType } from "@storiny/shared";
import React from "react";

import { get_token, verify_email } from "~/common/grpc";
import { handle_exception } from "~/common/grpc/utils";

import VerifyEmailInvalidToken from "../invalid-token";
import VerifyEmailSuccess from "../success";

const Page = async ({
  params: { token }
}: {
  params: { token: string };
}): Promise<React.ReactElement | undefined> => {
  try {
    const token_response = await get_token({
      identifier: token,
      type: TokenType.EMAIL_VERIFICATION
    });

    if (token_response.is_valid) {
      try {
        await verify_email({
          identifier: token
        });

        return <VerifyEmailSuccess />;
      } catch (e) {
        handle_exception(e);
      }
    }

    return <VerifyEmailInvalidToken />;
  } catch (e) {
    handle_exception(e);
  }
};

export { metadata } from "./metadata";
export default Page;
