import clsx from "clsx";
import { useAtomValue as use_atom_value } from "jotai";
import React from "react";

import { preview_color_atom } from "../../atoms";
import common_styles from "../common.module.scss";
import styles from "./preview.module.scss";

const Preview = (): React.ReactElement => {
  const color = use_atom_value(preview_color_atom);
  return (
    <span
      aria-hidden
      className={clsx(common_styles["transparent-grid"], styles.preview)}
      style={
        {
          "--color": color || "transparent"
        } as React.CSSProperties
      }
    />
  );
};

export default Preview;
