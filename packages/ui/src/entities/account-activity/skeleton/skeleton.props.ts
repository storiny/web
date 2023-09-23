import React from "react";

export interface AccountActivitySkeletonProps
  extends React.ComponentPropsWithoutRef<"div"> {
  /**
   * If `true`, does not render the vertical connecting pipe
   * @default false
   */
  hidePipe?: boolean;
}
