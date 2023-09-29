import { clsx } from "clsx";
import React from "react";

import ScrollArea from "../../../../../../packages/ui/src/components/scroll-area";

import styles from "./Pre.module.scss";

const Pre = ({
  children,
  className
}: React.ComponentPropsWithoutRef<"pre">): React.ReactElement => (
  <ScrollArea
    as={"pre"}
    className={className}
    enable_horizontal
    slot_props={{
      viewport: { className: clsx(styles.x, styles.viewport) }
    }}
    type={"auto"}
  >
    {children}
  </ScrollArea>
);

export default Pre;
