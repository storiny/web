import "server-only";

import React from "react";

import StoriesMetricsClient from "./client";

const Page = (): React.ReactElement => <StoriesMetricsClient />;

export * from "./metadata";
export default Page;
