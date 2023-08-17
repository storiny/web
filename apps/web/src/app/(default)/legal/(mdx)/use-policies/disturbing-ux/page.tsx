import "server-only";

import React from "react";

import DisturbingUXClient from "./client";

const Page = (): React.ReactElement => <DisturbingUXClient />;

export * from "./metadata";
export default Page;
