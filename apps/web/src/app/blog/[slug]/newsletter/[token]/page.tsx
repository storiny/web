import "server-only";

import React from "react";

import { verify_newsletter_subscription } from "~/common/grpc";
import { handle_exception } from "~/common/grpc/utils";

import Client from "./client";

const Page = async ({
  params: { token }
}: {
  params: { token: string };
}): Promise<React.ReactElement | undefined> => {
  try {
    const token_response = await verify_newsletter_subscription({
      identifier: token
    });

    return <Client is_valid={token_response.is_valid} />;
  } catch (e) {
    handle_exception(e);
  }
};

export { metadata } from "./metadata";
export default Page;
