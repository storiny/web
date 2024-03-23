import clsx from "clsx";
import React from "react";

import Button from "~/components/button";
import Link from "~/components/link";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import { use_media_query } from "~/hooks/use-media-query";
import CloudOffIcon from "~/icons/cloud-off";
import RetryIcon from "~/icons/retry";
import ServerErrorIcon from "~/icons/server-error";
import { BREAKPOINTS } from "~/theme/breakpoints";
import css from "~/theme/main.module.scss";

import styles from "./error-state.module.scss";
import { ErrorStateProps } from "./error-state.props";

const ErrorState = React.forwardRef<HTMLDivElement, ErrorStateProps>(
  (props, ref) => {
    const {
      className,
      type = "network",
      size: size_prop = "md",
      auto_size,
      retry,
      component_props,
      ...rest
    } = props;
    const is_mobile = use_media_query(BREAKPOINTS.down("mobile"));
    const size = auto_size ? (is_mobile ? "sm" : "md") : size_prop;

    return (
      <div
        {...rest}
        className={clsx(
          css["flex-col"],
          styles["error-state"],
          styles[size],
          className
        )}
        data-error-type={type}
        ref={ref}
      >
        <span className={clsx(css["flex-center"], styles.icon)}>
          {type === "server" ? <ServerErrorIcon /> : <CloudOffIcon />}
        </span>
        <div className={clsx(css["flex-col"], css["t-center"], styles.content)}>
          <Typography color={"major"} level={"body2"} weight={"bold"}>
            {type === "server" ? "Server" : "Network"} error
          </Typography>
          <Typography color={"minor"} level={"body3"}>
            {type === "server" ? (
              <>
                An invalid response was received from the server. Please check
                our{" "}
                <Link
                  href={process.env.NEXT_PUBLIC_STATUS_PAGE_URL || "/"}
                  underline={"always"}
                >
                  status page
                </Link>{" "}
                and try again after a few minutes or{" "}
                <Link href={"mailto:support@storiny.com"} underline={"always"}>
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
