import "server-only";

import React from "react";

import DoxxingPolicyClient from "./client";

const Page = (): React.ReactElement => <DoxxingPolicyClient />;

export { metadata } from "./metadata";
export default Page;
