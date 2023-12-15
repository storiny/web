import "server-only";

import React from "react";

import DMCAPolicyClient from "./client";

const Page = (): React.ReactElement => <DMCAPolicyClient />;

export * from "./metadata";
export default Page;
