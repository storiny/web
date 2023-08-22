import { dynamicLoader } from "@storiny/web/src/common/dynamic";
import dynamic from "next/dynamic";
import React from "react";

import WhiteboardLoader from "./Loader";

const Whiteboard = dynamic(() => import("@storiny/whiteboard"), {
  ssr: false,
  loading: dynamicLoader(() => <WhiteboardLoader />)
});

export default Whiteboard;
