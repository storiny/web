import "server-only";

import React from "react";

import AuthLayout from "../../../(native)/(auth)/layout";
import Client from "./client";

const Page = (): React.ReactElement => (
  <AuthLayout>
    <Client />
  </AuthLayout>
);

export { metadata } from "./metadata";
export default Page;
