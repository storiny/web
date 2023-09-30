import clsx from "clsx";
import React from "react";

import Typography from "~/components/typography";
import { use_media_query } from "~/hooks/use-media-query";
import { BREAKPOINTS } from "~/theme/breakpoints";

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
          "flex-col",
          styles["custom-state"],
          styles[size],
          className
        )}
        ref={ref}
      >
        {icon && (
          <span className={clsx("flex-center", styles.icon)}>{icon}</span>
        )}
        <div className={clsx("flex-col", "t-center", styles.content)}>
          <Typography className={clsx("t-bold", "t-major", styles.title)}>
            {title}
          </Typography>
          {description && (
            <Typography className={"t-minor"} level={"body2"}>
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
