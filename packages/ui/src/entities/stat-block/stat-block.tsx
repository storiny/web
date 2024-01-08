import clsx from "clsx";
import React from "react";

import Typography from "~/components/typography";
import css from "~/theme/main.module.scss";

import styles from "./stat-block.module.scss";
import { StatBlockProps } from "./stat-block.props";

const StatBlock = (props: StatBlockProps): React.ReactElement => {
  const {
    label,
    value,
    caption,
    caption_icon,
    className,
    component_props,
    ...rest
  } = props;

  return (
    <div
      {...rest}
      className={clsx(css["flex-col"], styles["stat-block"], className)}
    >
      <Typography
        {...component_props?.label}
        className={clsx(css["t-medium"], component_props?.label?.className)}
        color={"minor"}
        level={"body2"}
      >
        {label}
      </Typography>
      <Typography
        {...component_props?.value}
        className={clsx(css["t-bold"], styles.value)}
      >
        {value}
      </Typography>
      {Boolean(caption) && (
        <Typography
          {...component_props?.caption}
          className={clsx(
            css["flex"],
            styles.caption,
            component_props?.caption?.className
          )}
          color={"minor"}
          level={"body3"}
        >
          {caption}
        </Typography>
      )}
    </div>
  );
};

export default StatBlock;
