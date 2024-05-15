import "server-only";

import React from "react";

import BlogSidebarsClient from "./client";

const Page = (): React.ReactElement => <BlogSidebarsClient />;

export { metadata } from "./metadata";
export default Page;
