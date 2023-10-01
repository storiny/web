import { DeviceType } from "@storiny/shared";
import { clsx } from "clsx";
import dynamic from "next/dynamic";
import React from "react";

import { dynamic_loader } from "~/common/dynamic";
import AspectRatio from "~/components/aspect-ratio";
import Button from "~/components/button";
import Divider from "~/components/divider";
import Spacer from "~/components/spacer";
import { use_toast } from "~/components/toast";
import Typography from "~/components/typography";
import { use_session_logout_mutation } from "~/redux/features";
import { DateFormat, format_date } from "~/utils/format-date";

import { DEVICE_TYPE_ICON_MAP } from "../icon-map";
import styles from "./login-item.module.scss";
import { LoginItemProps } from "./login-item.props";

const Map = dynamic(() => import("../map"), {
  loading: dynamic_loader()
});

const LogoutButton = (
  props: LoginItemProps & { on_logout: () => void }
): React.ReactElement => {
  const { login, on_logout } = props;
  const toast = use_toast();
  const [session_logout, { isLoading: is_loading }] =
    use_session_logout_mutation();

  /**
   * Destroys a session
   */
  const session_logout_impl = (): void => {
    session_logout({ id: login.id })
      .unwrap()
      .then(on_logout)
      .catch((e) =>
        toast(e?.data?.error || "Could not revoke your session", "error")
      );
  };

  return (
    <Button
      check_auth
      className={clsx("focus-invert", "f-grow", styles.x, styles.button)}
      disabled={is_loading}
      onClick={session_logout_impl}
      variant={"ghost"}
    >
      This wasn&apos;t me
    </Button>
  );
};

const LoginItem = (props: LoginItemProps): React.ReactElement => {
  const { login, ratio } = props;
  const [status, set_status] = React.useState<
    "acknowledged" | "revoked" | null
  >(null);

  return (
    <div className={clsx("flex-col", styles["login-item"])}>
      <div className={clsx("flex-center", styles.device)}>
        {DEVICE_TYPE_ICON_MAP[login.device?.type ?? DeviceType.UNKNOWN]}
        <Spacer />
        <div className={clsx("flex-col", styles.details)}>
          <Typography className={"t-medium"} ellipsis level={"body2"}>
            {login.device?.display_name || "Unknown device"}
          </Typography>
          <Typography className={"t-minor"} ellipsis level={"body3"}>
            {login.is_active ? (
              <React.Fragment>
                <span className={clsx("t-medium", styles["active-label"])}>
                  Active
                </span>{" "}
                <span className={"t-muted"}>&bull;</span>{" "}
                {login.location?.display_name || "Unknown location"}
              </React.Fragment>
            ) : (
              <React.Fragment>
                {login.location?.display_name || "Unknown location"}{" "}
                <span className={"t-muted"}>&bull;</span>{" "}
                {format_date(login.created_at, DateFormat.STANDARD)}
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
            hide_copyright
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
          <div className={clsx("flex-center", styles["footer-label"])}>
            <Typography className={"t-minor"} level={"body3"}>
              {status === "revoked" ? "Session revoked" : "Was this you?"}
            </Typography>
          </div>
          {status === null && (
            <div className={"flex-center"}>
              <Button
                check_auth
                className={clsx(
                  "focus-invert",
                  "f-grow",
                  styles.x,
                  styles.button
                )}
                onClick={(): void => set_status("acknowledged")}
                variant={"ghost"}
              >
                This was me
              </Button>
              <Divider orientation={"vertical"} />
              <LogoutButton
                on_logout={(): void => set_status("revoked")}
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
