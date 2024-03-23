import "server-only";

import React from "react";

import BlogAppearanceSettingsClient from "./client";

const Page = (): React.ReactElement => <BlogAppearanceSettingsClient />;

export { metadata } from "./metadata";
export default Page;
