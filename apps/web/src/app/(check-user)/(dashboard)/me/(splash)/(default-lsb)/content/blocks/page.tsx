import "server-only";

import { redirect } from "next/navigation";
import React from "react";

import { getUserBlockCount, getUserRelationsInfo } from "~/common/grpc";
import { handleException } from "~/common/grpc/utils";
import { getUser } from "~/common/utils/getUser";

import ContentRelationsClient from "./client";

const Page = async (): Promise<React.ReactElement | undefined> => {
  try {
    const userId = await getUser();

    if (!userId) {
      redirect("/login");
    }

    const blockCountResponse = await getUserBlockCount({
      id: userId
    });

    return <ContentRelationsClient {...blockCountResponse} />;
  } catch (e) {
    handleException(e);
  }
};

export * from "./metadata";
export default Page;
