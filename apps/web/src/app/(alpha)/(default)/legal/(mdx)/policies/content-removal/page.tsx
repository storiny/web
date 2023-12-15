import "server-only";

import React from "react";

import ContentRemovalPolicyClient from "./client";

const Page = (): React.ReactElement => <ContentRemovalPolicyClient />;

export * from "./metadata";
export default Page;
