"use client";

import { useSearchParams as use_search_params } from "next/navigation";
import React from "react";

const Page = (): React.ReactElement => {
  const collab_id = use_search_params().get("collab_id") || "";
  const right_frame_role =
    use_search_params().get("right_frame_role") || "editor";
  return (
    <React.Fragment>
      <iframe
        name={"left"}
        src={`/?collab_id=${collab_id}`}
        style={{
          position: "fixed",
          border: 0,
          top: 0,
          left: 0,
          width: "calc(50% - 1px)",
          height: "100%"
        }}
      />
      <iframe
        name={"right"}
        src={`/?collab_id=${collab_id}&role=${right_frame_role}`}
        style={{
          position: "fixed",
          border: 0,
          top: 0,
          left: "calc(50% + 1px)",
          width: "calc(50% - 1px)",
          height: "100%"
        }}
      />
    </React.Fragment>
  );
};

export default Page;
