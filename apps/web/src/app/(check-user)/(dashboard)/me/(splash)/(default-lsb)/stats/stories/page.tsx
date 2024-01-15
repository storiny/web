import "server-only";

import React from "react";

import StoriesStatsClient from "./client";

const Page = (): React.ReactElement => <StoriesStatsClient />;

export { metadata } from "./metadata";
export default Page;
