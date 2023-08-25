import { clsx } from "clsx";
import React from "react";

import Divider from "~/components/Divider";

import styles from "./padded-divider.module.scss";

const PaddedDivider = (): React.ReactElement => (
  <div className={clsx("flex-center", styles.x, styles["padded-divider"])}>
    <Divider orientation={"vertical"} />
  </div>
);

export default PaddedDivider;
