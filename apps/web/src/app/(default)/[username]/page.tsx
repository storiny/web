import "server-only";

import { userProps } from "@storiny/shared";
import { notFound } from "next/navigation";
import React from "react";

import { getProfile } from "~/common/grpc";
import { handleException } from "~/common/grpc/utils";
import { getUser } from "~/common/utils/getUser";

import Component from "./component";

const Page = async ({
  params: { username }
}: {
  params: { username: string };
}): Promise<React.ReactElement | undefined> => {
  try {
    if (
      username.length < userProps.username.minLength ||
      username.length > userProps.username.maxLength
    ) {
      notFound();
    }

    const userId = await getUser();
    const profile = await getProfile({
      username,
      current_user_id: userId || undefined
    });

    return <Component profile={profile} />;
  } catch (e) {
    handleException(e);
  }
};

export * from "./metadata";
export default Page;
