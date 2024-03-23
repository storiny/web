import clsx from "clsx";
import React from "react";

import Typography from "~/components/typography";
import { use_media_query } from "~/hooks/use-media-query";
import { BREAKPOINTS } from "~/theme/breakpoints";
import css from "~/theme/main.module.scss";

import styles from "./custom-state.module.scss";
import { CustomStateProps } from "./custom-state.props";

const CustomState = React.forwardRef<HTMLDivElement, CustomStateProps>(
  (props, ref) => {
    const {
      className,
      size: size_prop = "md",
      auto_size,
      title,
      description,
      icon,
      ...rest
    } = props;
    const is_mobile = use_media_query(BREAKPOINTS.down("mobile"));
    const size = auto_size ? (is_mobile ? "sm" : "md") : size_prop;

    return (
      <div
        {...rest}
        className={clsx(
          css["flex-col"],
          styles["custom-state"],
          styles[size],
          className
        )}
        ref={ref}
      >
        {icon && (
          <span className={clsx(css["flex-center"], styles.icon)}>{icon}</span>
        )}
        <div className={clsx(css["flex-col"], css["t-center"], styles.content)}>
          <Typography className={styles.title} color={"major"} weight={"bold"}>
            {title}
          </Typography>
          {description && (
            <Typography color={"minor"} level={"body2"}>
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
