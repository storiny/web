import "./Island.scss";

import clsx from "clsx";
import React from "react";

type IslandProps = {
  children: React.ReactNode;
  className?: string | boolean;
  padding?: number;
  style?: object;
};

export const Island = React.forwardRef<HTMLDivLayer, IslandProps>(
  ({ children, padding, className, style }, ref) => (
    <div
      className={clsx("Island", className)}
      ref={ref}
      style={{ "--padding": padding, ...style }}
    >
      {children}
    </div>
  )
);
