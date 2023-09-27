import clsx from "clsx";
import React from "react";

import Button from "~/components/Button";
import Link from "~/components/Link";
import Spacer from "~/components/Spacer";
import Typography from "~/components/Typography";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import CloudOffIcon from "~/icons/CloudOff";
import RetryIcon from "~/icons/Retry";
import ServerErrorIcon from "~/icons/ServerError";
import { breakpoints } from "~/theme/breakpoints";

import styles from "./ErrorState.module.scss";
import { ErrorStateProps } from "./ErrorState.props";

const ErrorState = React.forwardRef<HTMLDivElement, ErrorStateProps>(
  (props, ref) => {
    const {
      className,
      type = "network",
      size: sizeProp = "md",
      autoSize,
      retry,
      component_props,
      ...rest
    } = props;
    const isMobile = useMediaQuery(breakpoints.down("mobile"));
    const size = autoSize ? (isMobile ? "sm" : "md") : sizeProp;

    return (
      <div
        {...rest}
        className={clsx(
          "flex-col",
          styles["error-state"],
          styles[size],
          className
        )}
        data-error-type={type}
        ref={ref}
      >
        <span className={clsx("flex-center", styles.icon)}>
          {type === "server" ? <ServerErrorIcon /> : <CloudOffIcon />}
        </span>
        <div className={clsx("flex-col", "t-center", styles.content)}>
          <Typography className={clsx("t-bold", "t-major")} level={"body2"}>
            {type === "server" ? "Server" : "Network"} error
          </Typography>
          <Typography className={"t-minor"} level={"body3"}>
            {type === "server" ? (
              <>
                An invalid response was received from the server. Please check
                our{" "}
                <Link href={"/status"} underline={"always"}>
                  status page
                </Link>{" "}
                and try again after a few minutes or{" "}
                <Link href={"/support"} underline={"always"}>
                  contact support
                </Link>{" "}
                if the issue persists.
              </>
            ) : (
              "We were unable to reach our servers at the moment. Try again after checking your connection."
            )}
          </Typography>
        </div>
        <Spacer orientation={"vertical"} />
        <Button
          {...component_props?.button}
          decorator={<RetryIcon />}
          onClick={(event): void => {
            retry?.(event);
            component_props?.button?.onClick?.(event);
          }}
          size={"sm"}
        >
          Retry
        </Button>
      </div>
    );
  }
);

ErrorState.displayName = "ErrorState";

export default ErrorState;
