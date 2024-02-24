import "server-only";

import React from "react";

import ImpersonationPolicyClient from "./client";

const Page = (): React.ReactElement => <ImpersonationPolicyClient />;

export { metadata } from "./metadata";
export default Page;
