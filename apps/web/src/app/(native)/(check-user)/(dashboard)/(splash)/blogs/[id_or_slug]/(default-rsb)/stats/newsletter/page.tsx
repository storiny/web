import "server-only";

import React from "react";

import NewsletterStatsClient from "./client";

const Page = (): React.ReactElement => <NewsletterStatsClient />;

export { metadata } from "./metadata";
export default Page;
