import "server-only";

import React from "react";

import AccountMetricsClient from "./client";

const Page = (): React.ReactElement => <AccountMetricsClient />;

export { metadata } from "./metadata";
export default Page;
