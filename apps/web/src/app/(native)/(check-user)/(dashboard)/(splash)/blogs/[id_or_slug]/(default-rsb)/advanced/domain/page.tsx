import "server-only";

import React from "react";

import DomainSettingsClient from "./client";

const Page = (): React.ReactElement => <DomainSettingsClient />;

export { metadata } from "./metadata";
export default Page;
