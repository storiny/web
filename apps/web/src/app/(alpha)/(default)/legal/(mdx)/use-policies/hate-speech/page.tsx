import "server-only";

import React from "react";

import HateSpeechPolicyClient from "./client";

const Page = (): React.ReactElement => <HateSpeechPolicyClient />;

export { metadata } from "./metadata";
export default Page;
