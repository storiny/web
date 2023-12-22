import { DeviceType } from "@storiny/shared";
import { clsx } from "clsx";
import dynamic from "next/dynamic";
import React from "react";

import { dynamic_loader } from "~/common/dynamic";
import AspectRatio from "~/components/aspect-ratio";
import Button from "~/components/button";
import DateTime from "~/components/date-time";
import Divider from "~/components/divider";
import Spacer from "~/components/spacer";
import { use_toast } from "~/components/toast";
import Typography from "~/components/typography";
import {
  use_acknowledge_session_mutation,
  use_session_logout_mutation
} from "~/redux/features";
import css from "~/theme/main.module.scss";
import { handle_api_error } from "~/utils/handle-api-error";

import { DEVICE_TYPE_ICON_MAP } from "../icon-map";
import styles from "./login-item.module.scss";
import { LoginItemProps } from "./login-item.props";

const Map = dynamic(() => import("../map"), {
  loading: dynamic_loader(),
  ssr: false
});

const AcknowledgeButton = (
  props: LoginItemProps & { on_acknowledge: () => void }
): React.ReactElement => {
  const { login, on_acknowledge } = props;
  const toast = use_toast();
  const [acknowledge_session, { isLoading: is_loading }] =
    use_acknowledge_session_mutation();

  /**
   * Marks a session as acknowledged
   */
  const session_logout_impl = (): void => {
    acknowledge_session({ id: login.id })
      .unwrap()
      .then(on_acknowledge)
      .catch((error) =>
        handle_api_error(
          error,
          toast,
          null,
          "Could not acknowledge your session"
        )
      );
  };

  return (
    <Button
      check_auth
      className={clsx(
        css["focus-invert"],
        css["f-grow"],
        styles.x,
        styles.button
      )}
      disabled={is_loading}
      onClick={session_logout_impl}
      variant={"ghost"}
    >
      This was me
    </Button>
  );
};

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
      .catch((error) =>
        handle_api_error(error, toast, null, "Could not revoke your session")
      );
  };

  return (
    <Button
      check_auth
      className={clsx(
        css["focus-invert"],
        css["f-grow"],
        styles.x,
        styles.button
      )}
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
    <div className={clsx(css["flex-col"], styles["login-item"])}>
      <div className={clsx(css["flex-center"], styles.device)}>
        {DEVICE_TYPE_ICON_MAP[login.device?.type ?? DeviceType.UNKNOWN]}
        <Spacer />
        <div className={clsx(css["flex-col"], styles.details)}>
          <Typography className={css["t-medium"]} ellipsis level={"body2"}>
            {login.device?.display_name || "Unknown device"}
          </Typography>
          <Typography className={css["t-minor"]} ellipsis level={"body3"}>
            {login.is_active ? (
              <React.Fragment>
                <span className={clsx(css["t-medium"], styles["active-label"])}>
                  Active
                </span>{" "}
                <span className={css["t-muted"]}>&bull;</span>{" "}
                {login.location?.display_name || "Unknown location"}
              </React.Fragment>
            ) : (
              <React.Fragment>
                {login.location?.display_name || "Unknown location"}{" "}
                <span className={css["t-muted"]}>&bull;</span>{" "}
                <DateTime date={login.created_at} />
              </React.Fragment>
            )}
          </Typography>
        </div>
      </div>
      <AspectRatio
        className={clsx(css["full-w"], css["flex-col"], styles.x, styles.map)}
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
          <div className={css["flex-center"]}>
            <Typography className={css["t-minor"]} level={"body2"}>
              Unknown location
            </Typography>
          </div>
        )}
      </AspectRatio>
      {status !== "acknowledged" && !login.is_active ? (
        <div className={css["flex-col"]}>
          <div className={clsx(css["flex-center"], styles["footer-label"])}>
            <Typography className={css["t-minor"]} level={"body3"}>
              {status === "revoked" ? "Session revoked" : "Was this you?"}
            </Typography>
          </div>
          {status === null && (
            <div className={css["flex-center"]}>
              <AcknowledgeButton
                on_acknowledge={(): void => set_status("acknowledged")}
                {...props}
              />
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
