import "server-only";

import React from "react";

import StoriesMetricsClient from "./client";

const Page = (): React.ReactElement => <StoriesMetricsClient />;

export { metadata } from "./metadata";
export default Page;
