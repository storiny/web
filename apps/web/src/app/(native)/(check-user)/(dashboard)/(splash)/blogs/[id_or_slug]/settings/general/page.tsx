import "server-only";

import React from "react";

import GeneralSettingsClient from "./client";

const Page = (): React.ReactElement => <GeneralSettingsClient />;

export { metadata } from "./metadata";
export default Page;
