import "server-only";

import React from "react";

import ObsceneContentPolicy from "./client";

const Page = (): React.ReactElement => <ObsceneContentPolicy />;

export * from "./metadata";
export default Page;
