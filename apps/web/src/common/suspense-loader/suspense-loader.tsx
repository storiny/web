import { clsx } from "clsx";
import React from "react";

import { SuspenseLoaderProps } from "~/common/suspense-loader/suspense-loader.props";
import Spinner from "~/components/spinner";
import css from "~/theme/main.module.scss";

import styles from "./suspense-loader.module.scss";

const SuspenseLoader = (props: SuspenseLoaderProps): React.ReactElement => {
  const { className, ...rest } = props;
  return (
    <div
      {...rest}
      className={clsx(
        css["flex-center"],
        css["full-w"],
        styles["suspense-loader"],
        className
      )}
    >
      <Spinner />
    </div>
  );
};

export default SuspenseLoader;
