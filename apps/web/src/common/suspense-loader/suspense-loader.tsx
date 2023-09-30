import { clsx } from "clsx";
import React from "react";

import { SuspenseLoaderProps } from "~/common/suspense-loader/suspense-loader.props";
import Spinner from "../../../../../packages/ui/src/components/spinner";

import styles from "./suspense-loader.module.scss";

const SuspenseLoader = (props: SuspenseLoaderProps): React.ReactElement => {
  const { className, ...rest } = props;
  return (
    <div
      {...rest}
      className={clsx(
        "flex-center",
        "full-w",
        styles["suspense-loader"],
        className
      )}
    >
      <Spinner />
    </div>
  );
};

export default SuspenseLoader;
