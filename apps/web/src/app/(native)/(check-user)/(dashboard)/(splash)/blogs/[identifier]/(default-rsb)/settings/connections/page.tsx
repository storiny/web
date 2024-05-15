import "server-only";

import React from "react";

import BlogConnectionsClient from "./client";

const Page = (): React.ReactElement => <BlogConnectionsClient />;

export { metadata } from "./metadata";
export default Page;
