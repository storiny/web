import "server-only";

import React from "react";

import ViolentContentPolicy from "./client";

const Page = (): React.ReactElement => <ViolentContentPolicy />;

export { metadata } from "./metadata";
export default Page;
