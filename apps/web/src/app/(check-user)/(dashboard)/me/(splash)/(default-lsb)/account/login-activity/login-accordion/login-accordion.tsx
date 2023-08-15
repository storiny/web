import { DeviceType } from "@storiny/shared";
import { clsx } from "clsx";
import dynamic from "next/dynamic";
import NextLink from "next/link";
import React from "react";

import SuspenseLoader from "~/common/suspense-loader";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "~/components/Accordion";
import AspectRatio from "~/components/AspectRatio";
import Button from "~/components/Button";
import Divider from "~/components/Divider";
import Spacer from "~/components/Spacer";
import { useToast } from "~/components/Toast";
import Typography from "~/components/Typography";
import LogoutIcon from "~/icons/Logout";
import { useSessionLogoutMutation } from "~/redux/features";
import { DateFormat, formatDate } from "~/utils/formatDate";

import { deviceTypeToIconMap } from "../icon-map";
import styles from "./login-accordion.module.scss";
import { LoginAccordionProps } from "./login-accordion.props";

const Map = dynamic(() => import("../map"), {
  loading: () => (
    <AspectRatio
      className={clsx("full-w", styles.x, styles.loader)}
      ratio={2.85}
    >
      <SuspenseLoader className={"full-h"} />
    </AspectRatio>
  )
});

const LogoutButton = (props: LoginAccordionProps): React.ReactElement => {
  const { login, onLogout } = props;
  const toast = useToast();
  const [sessionLogout, { isLoading }] = useSessionLogoutMutation();

  /**
   * Destroys a session
   */
  const sessionLogoutImpl = (): void => {
    sessionLogout({ id: login.id })
      .unwrap()
      .then(() => {
        onLogout();
        toast("Session successfully revoked", "success");
      })
      .catch((e) => toast(e?.data?.error || "Could not log you out", "error"));
  };

  return (
    <Button
      className={clsx("focus-invert", "f-grow", styles.x, styles.button)}
      decorator={<LogoutIcon />}
      loading={isLoading}
      variant={"ghost"}
      {...(login.is_active
        ? { as: NextLink, href: "/logout" }
        : { onClick: sessionLogoutImpl })}
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
          slotProps={{
            header: {
              as: "div"
            },
            icon: {
              className: clsx(styles.x, styles.icon)
            }
          }}
        >
          <span className={clsx("flex-center", styles.x, styles.wrapper)}>
            {deviceTypeToIconMap[login.device?.type ?? DeviceType.UNKNOWN]}
            <Spacer size={2} />
            <span className={clsx("flex-col", styles.x, styles.details)}>
              <Typography as={"span"} className={"t-medium"} ellipsis>
                {login.device?.display_name || "Unknown device"}
              </Typography>
              <Typography
                as={"span"}
                className={"t-minor"}
                ellipsis
                level={"body2"}
              >
                {login.is_active ? (
                  <React.Fragment>
                    <span
                      className={clsx(
                        "t-medium",
                        styles.x,
                        styles["active-label"]
                      )}
                    >
                      Current device
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
            </span>
          </span>
          <Spacer className={"f-grow"} size={3} />
        </AccordionTrigger>
        <AccordionContent
          slotProps={{
            wrapper: { className: clsx(styles.x, styles["content-wrapper"]) }
          }}
        >
          <Spacer orientation={"vertical"} size={2} />
          <div className={clsx("flex-col", styles.x, styles.content)}>
            {typeof login.location?.lat !== "undefined" &&
            typeof login.location?.lng !== "undefined" ? (
              <Map
                lat={login.location.lat}
                lng={login.location.lng}
                ratio={2.85}
              />
            ) : (
              <AspectRatio className={"full-w"} ratio={2.85}>
                <div className={"flex-center"}>
                  <Typography className={"t-minor"} level={"body2"}>
                    Unknown location
                  </Typography>
                </div>
              </AspectRatio>
            )}
            <LogoutButton {...props} />
          </div>
        </AccordionContent>
      </AccordionItem>
      {login.is_active && <Divider className={"hide-last"} />}
    </React.Fragment>
  );
};

export default LoginAccordion;
