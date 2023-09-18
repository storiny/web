"use client";

import { useSearchParams } from "next/navigation";
import React from "react";

import Editor from "../../components/editor";

const Page = (): React.ReactElement => {
  const collabId = useSearchParams().get("collab_id") || "";
  return <Editor docId={collabId} role={"editor"} />;
};

export default Page;
