import "server-only";

import React from "react";

import AcknowledgementsClient from "./client";

const Page = (): React.ReactElement => <AcknowledgementsClient />;

export * from "./metadata";
export default Page;
