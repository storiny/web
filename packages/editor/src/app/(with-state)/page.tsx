"use client";

import { MOCK_STORIES } from "@storiny/ui/src/mocks";
import { useSearchParams as use_search_params } from "next/navigation";
import React from "react";

import Editor from "../../components/editor";

const Page = (): React.ReactElement => {
  const collab_id = use_search_params().get("collab_id") || "";
  return <Editor doc_id={collab_id} role={"editor"} story={MOCK_STORIES[5]} />;
};

export default Page;
