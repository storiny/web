import "server-only";

import { redirect } from "next/navigation";
import React from "react";

import { getUserCredentials } from "~/common/grpc";
import { handleException } from "~/common/grpc/utils";
import { getUser } from "~/common/utils/getUser";

import CredentialsClient from "./client";

const Page = async (): Promise<React.ReactElement | undefined> => {
  try {
    const userId = await getUser();

    if (!userId) {
      redirect("/login");
    }

    const credentialsResponse = await getUserCredentials({ id: userId });

    return <CredentialsClient {...credentialsResponse} />;
  } catch (e) {
    handleException(e);
  }
};

export default Page;
