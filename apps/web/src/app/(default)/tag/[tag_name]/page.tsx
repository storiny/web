import "server-only";

import React from "react";

import { get_tag } from "~/common/grpc";
import { handle_exception } from "~/common/grpc/utils";
import { get_user } from "src/common/utils/get-user";

import Component from "./component";

const Page = async ({
  params: { tag_name }
}: {
  params: { tag_name: string };
}): Promise<React.ReactElement | undefined> => {
  try {
    const user_id = await get_user();
    const tag = await get_tag({
      name: tag_name,
      current_user_id: user_id || undefined
    });

    return <Component tag={tag} />;
  } catch (e) {
    handle_exception(e);
  }
};

export * from "./metadata";
export default Page;
