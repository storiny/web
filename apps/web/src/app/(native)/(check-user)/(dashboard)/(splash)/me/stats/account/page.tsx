import "server-only";

import React from "react";

import AccountStatsClient from "./client";

const Page = (): React.ReactElement => <AccountStatsClient />;

export { metadata } from "./metadata";
export default Page;
