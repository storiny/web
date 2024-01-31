import React from "react";

import Skeleton from "~/components/skeleton";

const BadgeSkeleton = (): React.ReactElement => (
  <Skeleton
    style={
      {
        "--height": "var(--badge-size, 24px)",
        "--width": "var(--badge-size, 24px)"
      } as React.CSSProperties
    }
  />
);

export default BadgeSkeleton;
