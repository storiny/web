import "server-only";

import { redirect } from "next/navigation";
import React from "react";

import { getUserRelationsInfo } from "~/common/grpc";
import { handleException } from "~/common/grpc/utils";
import { getUser } from "~/common/utils/getUser";

import ContentRelationsClient from "./client";

const Page = async (): Promise<React.ReactElement | undefined> => {
  try {
    const user_id = await getUser();

    if (!user_id) {
      redirect("/login");
    }

    const userRelationsInfoResponse = await getUserRelationsInfo({
      id: user_id
    });

    return <ContentRelationsClient {...userRelationsInfoResponse} />;
  } catch (e) {
    handleException(e);
  }
};

export * from "./metadata";
export default Page;
