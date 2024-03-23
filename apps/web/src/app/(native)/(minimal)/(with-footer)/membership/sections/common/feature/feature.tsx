import { clsx } from "clsx";
import React from "react";

import Typography from "~/components/typography";
import CheckIcon from "~/icons/check";
import css from "~/theme/main.module.scss";

import styles from "./feature.module.scss";

const Feature = ({ value }: { value: React.ReactNode }): React.ReactElement => (
  <Typography as={"div"} className={clsx(css["flex-center"], styles.feature)}>
    <span className={clsx(css["flex-center"], styles.icon)}>
      <CheckIcon />
    </span>
    <span className={clsx(css.ellipsis, styles.content)}>{value}</span>
  </Typography>
);

export default Feature;
