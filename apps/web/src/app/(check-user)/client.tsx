"use client";

import React from "react";

import { useLoginRedirect } from "~/common/utils";

interface Props {
  children: React.ReactNode;
  userId: string | null;
}

const CheckUserClient = ({ children, userId }: Props): React.ReactElement => {
  const redirect = useLoginRedirect();

  if (!userId) {
    redirect();
  }

  return <React.Fragment>{children}</React.Fragment>;
};

export default CheckUserClient;
