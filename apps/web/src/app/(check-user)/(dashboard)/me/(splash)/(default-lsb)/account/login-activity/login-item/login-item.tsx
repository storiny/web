import { DeviceType } from "@storiny/shared";
import { clsx } from "clsx";
import dynamic from "next/dynamic";
import React from "react";

import { dynamicLoader } from "~/common/dynamic";
import AspectRatio from "~/components/AspectRatio";
import Button from "~/components/Button";
import Divider from "~/components/Divider";
import Spacer from "~/components/Spacer";
import { useToast } from "~/components/Toast";
import Typography from "~/components/Typography";
import { use_session_logout_mutation } from "~/redux/features";
import { DateFormat, formatDate } from "~/utils/formatDate";

import { deviceTypeToIconMap } from "../icon-map";
import styles from "./login-item.module.scss";
import { LoginItemProps } from "./login-item.props";

const Map = dynamic(() => import("../map"), {
  loading: dynamicLoader()
});

const LogoutButton = (
  props: LoginItemProps & { onLogout: () => void }
): React.ReactElement => {
  const { login, onLogout } = props;
  const toast = useToast();
  const [sessionLogout, { isLoading }] = use_session_logout_mutation();

  /**
   * Destroys a session
   */
  const sessionLogoutImpl = (): void => {
    sessionLogout({ id: login.id })
      .unwrap()
      .then(onLogout)
      .catch((e) =>
        toast(e?.data?.error || "Could not revoke your session", "error")
      );
  };

  return (
    <Button
      checkAuth
      className={clsx("focus-invert", "f-grow", styles.x, styles.button)}
      disabled={isLoading}
      onClick={sessionLogoutImpl}
      variant={"ghost"}
    >
      This wasn&apos;t me
    </Button>
  );
};

const LoginItem = (props: LoginItemProps): React.ReactElement => {
  const { login, ratio } = props;
  const [status, setStatus] = React.useState<"acknowledged" | "revoked" | null>(
    null
  );

  return (
    <div className={clsx("flex-col", styles.x, styles["login-item"])}>
      <div className={clsx("flex-center", styles.x, styles.device)}>
        {deviceTypeToIconMap[login.device?.type ?? DeviceType.UNKNOWN]}
        <Spacer />
        <div className={clsx("flex-col", styles.x, styles.details)}>
          <Typography className={"t-medium"} ellipsis level={"body2"}>
            {login.device?.display_name || "Unknown device"}
          </Typography>
          <Typography className={"t-minor"} ellipsis level={"body3"}>
            {login.is_active ? (
              <React.Fragment>
                <span
                  className={clsx("t-medium", styles.x, styles["active-label"])}
                >
                  Active
                </span>{" "}
                <span className={"t-muted"}>&bull;</span>{" "}
                {login.location?.display_name || "Unknown location"}
              </React.Fragment>
            ) : (
              <React.Fragment>
                {login.location?.display_name || "Unknown location"}{" "}
                <span className={"t-muted"}>&bull;</span>{" "}
                {formatDate(login.created_at, DateFormat.STANDARD)}
              </React.Fragment>
            )}
          </Typography>
        </div>
      </div>
      <AspectRatio
        className={clsx("full-w", "flex-col", styles.x, styles.map)}
        ratio={ratio || 1.44}
      >
        {typeof login.location?.lat !== "undefined" &&
        typeof login.location?.lng !== "undefined" ? (
          <Map
            hideCopyright
            lat={login.location.lat}
            lng={login.location.lng}
            ratio={ratio || 1.44}
          />
        ) : (
          <div className={"flex-center"}>
            <Typography className={"t-minor"} level={"body2"}>
              Unknown location
            </Typography>
          </div>
        )}
      </AspectRatio>
      {status !== "acknowledged" && !login.is_active ? (
        <div className={clsx("flex-col")}>
          <div
            className={clsx("flex-center", styles.x, styles["footer-label"])}
          >
            <Typography className={"t-minor"} level={"body3"}>
              {status === "revoked" ? "Session revoked" : "Was this you?"}
            </Typography>
          </div>
          {status === null && (
            <div className={"flex-center"}>
              <Button
                checkAuth
                className={clsx(
                  "focus-invert",
                  "f-grow",
                  styles.x,
                  styles.button
                )}
                onClick={(): void => setStatus("acknowledged")}
                variant={"ghost"}
              >
                This was me
              </Button>
              <Divider orientation={"vertical"} />
              <LogoutButton
                onLogout={(): void => setStatus("revoked")}
                {...props}
              />
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default LoginItem;
