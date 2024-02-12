import clsx from "clsx";
import React from "react";

import Typography from "~/components/typography";
import css from "~/theme/main.module.scss";

import styles from "./custom-state.module.scss";
import { CustomStateProps } from "./custom-state.props";

const CustomState = React.forwardRef<HTMLDivElement, CustomStateProps>(
  (props, ref) => {
    const {
      className,
      size = "md",
      auto_size,
      title,
      description,
      icon,
      ...rest
    } = props;
    return (
      <div
        {...rest}
        className={clsx(
          css["flex-col"],
          styles["custom-state"],
          styles[size],
          auto_size && styles["auto-size"],
          className
        )}
        ref={ref}
      >
        {icon && (
          <span className={clsx(css["flex-center"], styles.icon)}>{icon}</span>
        )}
        <div className={clsx(css["flex-col"], css["t-center"], styles.content)}>
          <Typography
            className={clsx(css["t-bold"], css["t-major"], styles.title)}
          >
            {title}
          </Typography>
          {description && (
            <Typography className={css["t-minor"]} level={"body2"}>
              {description}
            </Typography>
          )}
        </div>
      </div>
    );
  }
);

CustomState.displayName = "CustomState";

export default CustomState;
