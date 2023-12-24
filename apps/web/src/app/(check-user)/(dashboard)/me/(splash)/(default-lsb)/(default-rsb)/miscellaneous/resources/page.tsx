import "server-only";

import React from "react";

import MiscellaneousResourcesClient from "./client";

const Page = (): React.ReactElement => <MiscellaneousResourcesClient />;

export { metadata } from "./metadata";
export default Page;
