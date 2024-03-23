import "server-only";

import React from "react";

import ProfileSettingsClient from "./client";

const Page = (): React.ReactElement => <ProfileSettingsClient />;

export { metadata } from "./metadata";
export default Page;
