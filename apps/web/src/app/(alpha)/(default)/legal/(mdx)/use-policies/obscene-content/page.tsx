import "server-only";

import React from "react";

import ObsceneContentPolicy from "./client";

const Page = (): React.ReactElement => <ObsceneContentPolicy />;

export { metadata } from "./metadata";
export default Page;
