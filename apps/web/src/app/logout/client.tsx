"use client";

import React from "react";

import { use_app_router } from "~/common/utils";
import { logout_user } from "~/redux/features";
import { use_app_dispatch } from "~/redux/hooks";

const Client = ({
  logout,
  to
}: {
  logout: () => Promise<void>;
  to: string;
}): null => {
  const router = use_app_router();
  const dispatch = use_app_dispatch();

  React.useEffect(() => {
    dispatch(logout_user());
    logout().then(() => {
      router.replace(to);
      router.refresh(); // Refresh the state
    });
  }, [dispatch, logout, router, to]);

  return null;
};

export default Client;
