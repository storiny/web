import "server-only";

import React from "react";

import { getProfile } from "~/common/grpc";
import { handleException } from "~/common/grpc/utils";
import { getUser } from "~/common/utils";

import Component from "./component";

const Page = async ({
  params: { username },
}: {
  params: { username: string };
}): Promise<React.ReactElement | undefined> => {
  try {
    const userId = await getUser();
    const profile = await getProfile({
      username,
      current_user_id: userId || undefined,
    });

    return <Component profile={profile} />;
  } catch (e) {
    handleException(e);
  }
};

export default Page;
