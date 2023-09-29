"use client";

import { MOCK_STORIES } from "@storiny/ui/src/mocks";
import { useSearchParams } from "next/navigation";
import React from "react";

import Editor from "../../components/editor";

const Page = (): React.ReactElement => {
  const collabId = useSearchParams().get("collab_id") || "";
  return <Editor docId={collabId} role={"editor"} story={MOCK_STORIES[5]} />;
};

export default Page;
