import { clsx } from "clsx";
import React from "react";

import ScrollArea from "~/components/ScrollArea";

import styles from "./Pre.module.scss";

const Pre = ({
  children,
  className
}: React.ComponentPropsWithoutRef<"pre">): React.ReactElement => (
  <ScrollArea
    as={"pre"}
    className={className}
    enableHorizontal
    slotProps={{
      viewport: { className: clsx(styles.x, styles.viewport) }
    }}
    type={"auto"}
  >
    {children}
  </ScrollArea>
);

export default Pre;
