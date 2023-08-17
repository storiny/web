import "server-only";

import React from "react";

import { getTag } from "~/common/grpc";
import { handleException } from "~/common/grpc/utils";
import { getUser } from "~/common/utils/getUser";

import Component from "./component";

const Page = async ({
  params: { tagName }
}: {
  params: { tagName: string };
}): Promise<React.ReactElement | undefined> => {
  try {
    const userId = await getUser();
    const tag = await getTag({
      name: tagName,
      current_user_id: userId || undefined
    });

    return <Component tag={tag} />;
  } catch (e) {
    handleException(e);
  }
};

export * from "./metadata";
export default Page;
