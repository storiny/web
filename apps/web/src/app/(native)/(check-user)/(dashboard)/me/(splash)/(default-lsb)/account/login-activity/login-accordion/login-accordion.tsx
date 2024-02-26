import { DeviceType } from "@storiny/shared";
import { clsx } from "clsx";
import dynamic from "next/dynamic";
import NextLink from "next/link";
import React from "react";

import { dynamic_loader } from "~/common/dynamic";
import SuspenseLoader from "~/common/suspense-loader";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "~/components/accordion";
import AspectRatio from "~/components/aspect-ratio";
import Button from "~/components/button";
import DateTime from "~/components/date-time";
import Divider from "~/components/divider";
import Spacer from "~/components/spacer";
import { use_toast } from "~/components/toast";
import Typography from "~/components/typography";
import LogoutIcon from "~/icons/logout";
import { use_session_logout_mutation } from "~/redux/features";
import css from "~/theme/main.module.scss";
import { handle_api_error } from "~/utils/handle-api-error";

import { DEVICE_TYPE_ICON_MAP } from "../icon-map";
import styles from "./login-accordion.module.scss";
import { LoginAccordionProps } from "./login-accordion.props";

const Map = dynamic(() => import("../map"), {
  ssr: false,
  loading: dynamic_loader(() => (
    <AspectRatio
      className={clsx(css["full-w"], styles.x, styles.loader)}
      ratio={2.85}
    >
      <SuspenseLoader className={css["full-h"]} />
    </AspectRatio>
  ))
});

const LogoutButton = (props: LoginAccordionProps): React.ReactElement => {
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
      .then(() => {
        on_logout();
        toast("Session successfully revoked", "success");
      })
      .catch((error) =>
        handle_api_error(error, toast, null, "Could not log you out")
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
      decorator={<LogoutIcon />}
      loading={is_loading}
      variant={"ghost"}
      {...(login.is_active
        ? { as: NextLink, href: "/logout" }
        : { onClick: session_logout_impl })}
    >
      Log out
    </Button>
  );
};

const LoginAccordion = (props: LoginAccordionProps): React.ReactElement => {
  const { login } = props;
  return (
    <React.Fragment>
      <AccordionItem
        className={clsx(styles.x, styles["login-accordion"])}
        value={login.id}
      >
        <AccordionTrigger
          className={clsx(styles.x, styles.trigger)}
          slot_props={{
            header: {
              as: "div"
            },
            icon: {
              className: clsx(styles.x, styles.icon)
            }
          }}
        >
          <span className={clsx(css["flex-center"], styles.wrapper)}>
            {DEVICE_TYPE_ICON_MAP[login.device?.type ?? DeviceType.UNKNOWN]}
            <Spacer size={2} />
            <span className={clsx(css["flex-col"], styles.details)}>
              <Typography as={"span"} ellipsis weight={"medium"}>
                {login.device?.display_name || "Unknown device"}
              </Typography>
              <Typography as={"span"} color={"minor"} ellipsis level={"body2"}>
                {login.is_active ? (
                  <React.Fragment>
                    <span
                      className={clsx(css["t-medium"], styles["active-label"])}
                    >
                      Current device
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
            </span>
          </span>
          <Spacer className={css["f-grow"]} size={3} />
        </AccordionTrigger>
        <AccordionContent
          slot_props={{
            wrapper: { className: clsx(styles.x, styles["content-wrapper"]) }
          }}
        >
          <Spacer orientation={"vertical"} size={2} />
          <div className={clsx(css["flex-col"], styles.content)}>
            {typeof login.location?.lat !== "undefined" &&
            typeof login.location?.lng !== "undefined" ? (
              <Map
                lat={login.location.lat}
                lng={login.location.lng}
                ratio={2.85}
              />
            ) : (
              <AspectRatio className={css["full-w"]} ratio={2.85}>
                <div className={css["flex-center"]}>
                  <Typography color={"minor"} level={"body2"}>
                    Unknown location
                  </Typography>
                </div>
              </AspectRatio>
            )}
            <LogoutButton {...props} />
          </div>
        </AccordionContent>
      </AccordionItem>
      {login.is_active && <Divider className={css["hide-last"]} />}
    </React.Fragment>
  );
};

export default LoginAccordion;
