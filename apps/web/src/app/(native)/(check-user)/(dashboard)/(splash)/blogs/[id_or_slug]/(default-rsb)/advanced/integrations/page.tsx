import "server-only";

import React from "react";

import IntegrationsClient from "./client";

const Page = (): React.ReactElement => <IntegrationsClient />;

export { metadata } from "./metadata";
export default Page;
