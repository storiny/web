import { clsx } from "clsx";
import React from "react";

import Divider from "~/components/divider";
import css from "~/theme/main.module.scss";

import styles from "./padded-divider.module.scss";

const PaddedDivider = (): React.ReactElement => (
  <div className={clsx(css["flex-center"], styles["padded-divider"])}>
    <Divider orientation={"vertical"} />
  </div>
);

export default PaddedDivider;
