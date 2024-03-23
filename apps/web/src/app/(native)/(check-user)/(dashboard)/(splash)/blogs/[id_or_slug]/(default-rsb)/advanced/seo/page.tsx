import "server-only";

import React from "react";

import SEOSettingsClient from "./client";

const Page = (): React.ReactElement => <SEOSettingsClient />;

export { metadata } from "./metadata";
export default Page;
