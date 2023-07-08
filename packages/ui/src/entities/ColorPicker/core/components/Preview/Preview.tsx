import clsx from "clsx";
import { useAtomValue } from "jotai";
import React from "react";

import { previewColorAtom } from "../../atoms";
import commonStyles from "../common.module.scss";
import styles from "./Preview.module.scss";

const Preview = (): React.ReactElement => {
  const color = useAtomValue(previewColorAtom);
  return (
    <span
      aria-hidden
      className={clsx(commonStyles["transparent-grid"], styles.preview)}
      style={
        {
          "--color": color || "transparent"
        } as React.CSSProperties
      }
    />
  );
};

export default Preview;
