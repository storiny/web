import { clsx } from "clsx";
import React from "react";

import Spinner from "~/components/Spinner";

import styles from "./SuspenseLoader.module.scss";

const SuspenseLoader = () => (
  <div className={clsx("flex-center", "full-w", styles["suspense-loader"])}>
    <Spinner />
  </div>
);

export default SuspenseLoader;
