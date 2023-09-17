"use client";

import { useSearchParams } from "next/navigation";
import React from "react";

const Page = (): React.ReactElement => {
  const collabId = useSearchParams().get("collab_id") || "";
  return (
    <React.Fragment>
      <iframe
        name={"left"}
        src={`/?collab_id=${collabId}`}
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
        src={`/?collab_id=${collabId}`}
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
