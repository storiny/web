import clsx from "clsx";
import React from "react";

import Typography from "~/components/Typography";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import { breakpoints } from "~/theme/breakpoints";

import styles from "./CustomState.module.scss";
import { CustomStateProps } from "./CustomState.props";

const CustomState = React.forwardRef<HTMLDivElement, CustomStateProps>(
  (props, ref) => {
    const {
      className,
      size: sizeProp = "md",
      autoSize,
      title,
      description,
      icon,
      ...rest
    } = props;
    const isMobile = useMediaQuery(breakpoints.down("mobile"));
    const size = autoSize ? (isMobile ? "sm" : "md") : sizeProp;

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
