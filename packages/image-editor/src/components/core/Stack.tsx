import "./Stack.scss";

import clsx from "clsx";
import React, { forwardRef } from "react";

type StackProps = {
  align?: "start" | "center" | "end" | "baseline";
  children: React.ReactNode;
  className?: string | boolean;
  gap?: number;
  justifyContent?: "center" | "space-around" | "space-between";
  ref: React.RefObject<HTMLDivLayer>;
  style?: React.CSSProperties;
};

const RowStack = forwardRef(
  (
    { children, gap, align, justifyContent, className, style }: StackProps,
    ref: React.ForwardedRef<HTMLDivLayer>
  ) => (
    <div
      className={clsx("Stack Stack_horizontal", className)}
      ref={ref}
      style={{
        "--gap": gap,
        alignItems: align,
        justifyContent,
        ...style
      }}
    >
      {children}
    </div>
  )
);

const ColStack = forwardRef(
  (
    { children, gap, align, justifyContent, className, style }: StackProps,
    ref: React.ForwardedRef<HTMLDivLayer>
  ) => (
    <div
      className={clsx("Stack Stack_vertical", className)}
      ref={ref}
      style={{
        "--gap": gap,
        justifyItems: align,
        justifyContent,
        ...style
      }}
    >
      {children}
    </div>
  )
);

export default {
  Row: RowStack,
  Col: ColStack
};
