import "server-only";

import { notFound as not_found } from "next/navigation";
import React from "react";

import { get_profile } from "~/common/grpc";
import { handle_exception } from "~/common/grpc/utils";
import { get_user } from "~/common/utils/get-user";
import { is_valid_username } from "~/common/utils/is-valid-username";

import Component from "./component";

const Page = async ({
  params: { username }
}: {
  params: { username: string };
}): Promise<React.ReactElement | undefined> => {
  try {
    if (!is_valid_username(username)) {
      not_found();
    }

    const user_id = await get_user();
    const profile = await get_profile({
      username,
      current_user_id: user_id || undefined
    });

    return <Component profile={profile} />;
  } catch (e) {
    handle_exception(e);
  }
};

export * from "./metadata";
export default Page;
