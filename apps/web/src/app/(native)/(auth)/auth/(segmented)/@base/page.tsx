"use client";

import { clsx } from "clsx";
import * as process from "process";
import React from "react";

import Button from "~/components/button";
import Divider from "~/components/divider";
import Grow from "~/components/grow";
import Link from "~/components/link";
import Spacer from "~/components/spacer";
import Tooltip from "~/components/tooltip";
import Typography from "~/components/typography";
import css from "~/theme/main.module.scss";

import { use_auth_state } from "../../../state";
import styles from "./styles.module.scss";

const AppleIcon = (): React.ReactElement => (
  <svg
    fill="none"
    height={18}
    viewBox="0 0 19 18"
    width={18}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M16.59 13.82a9.97 9.97 0 0 1-2.13 3.11c-.47.44-.98.66-1.53.68-.4 0-.87-.12-1.42-.34a4.07 4.07 0 0 0-1.53-.34 4.2 4.2 0 0 0-1.57.34c-.56.22-1 .34-1.35.35-.53.03-1.05-.2-1.57-.7a10.34 10.34 0 0 1-3.13-7.25c0-1.14.25-2.14.75-2.98a4.4 4.4 0 0 1 3.7-2.19 5 5 0 0 1 1.64.39c.68.25 1.11.38 1.3.38.14 0 .63-.15 1.45-.45.77-.28 1.42-.4 1.96-.35a4.2 4.2 0 0 1 3.27 1.72 3.63 3.63 0 0 0-1.93 3.3 3.6 3.6 0 0 0 1.2 2.74c.35.34.75.6 1.19.79l-.3.8ZM13.26.72c0 .86-.32 1.67-.95 2.41-.75.89-1.67 1.4-2.67 1.32l-.02-.33c0-.82.36-1.71 1-2.43.32-.37.73-.68 1.22-.92.5-.24.96-.37 1.4-.4l.02.35Z"
      // TODO: Replace the fill with `#fff` once the users are allowed to
      // continue with Apple
      fill="#8c8c8c"
    />
  </svg>
);

const GoogleIcon = (): React.ReactElement => (
  <svg
    fill="none"
    height={18}
    viewBox="0 0 19 18"
    width={18}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      clipRule="evenodd"
      d="M17.9 8.82c0-.61-.05-1.2-.15-1.76H9.63v3.33h4.64c-.2 1.08-.81 2-1.72 2.6v2.17h2.78a8.41 8.41 0 0 0 2.58-6.34Z"
      fill="#4285F4"
      fillRule="evenodd"
    />
    <path
      clipRule="evenodd"
      d="M9.62 17.25c2.33 0 4.29-.77 5.71-2.09L12.55 13a5.18 5.18 0 0 1-7.75-2.74H1.92v2.24a8.62 8.62 0 0 0 7.7 4.75Z"
      fill="#34A853"
      fillRule="evenodd"
    />
    <path
      clipRule="evenodd"
      d="M4.8 10.26A5.18 5.18 0 0 1 4.8 7V4.75H1.92a8.62 8.62 0 0 0 0 7.75l2.88-2.24Z"
      fill="#FBBC05"
      fillRule="evenodd"
    />
    <path
      clipRule="evenodd"
      d="M9.62 3.43c1.27 0 2.4.44 3.3 1.29l2.48-2.47a8.62 8.62 0 0 0-13.48 2.5L4.8 7a5.14 5.14 0 0 1 4.82-3.56Z"
      fill="#EA4335"
      fillRule="evenodd"
    />
  </svg>
);

const Page = (): React.ReactElement => {
  const { set_state } = use_auth_state();
  return (
    <>
      <Typography as={"h1"} level={"h3"}>
        Welcome to Storiny
      </Typography>
      <Spacer orientation={"vertical"} size={0.5} />
      <Typography className={css["t-minor"]} level={"body2"}>
        How would you like to proceed?
      </Typography>
      <Spacer orientation={"vertical"} size={5} />
      <div className={clsx(css["flex-col"], styles.actions)}>
        <Button
          onClick={(): void => set_state({ segment: "signup_base" })}
          size={"lg"}
        >
          Sign up with E-mail
        </Button>
        <Button
          onClick={(): void => set_state({ segment: "login" })}
          size={"lg"}
          variant={"hollow"}
        >
          Login with E-mail
        </Button>
        <div className={css["flex-center"]} style={{ paddingInline: "18px" }}>
          <Divider style={{ width: "100%" }} />
        </div>
        <Tooltip content={"Available soon"}>
          <div>
            <Button
              className={clsx(css["full-w"], styles.x, styles["apple-button"])}
              decorator={<AppleIcon />}
              disabled
              size={"lg"}
            >
              Continue with Apple
            </Button>
          </div>
        </Tooltip>
        <Button
          as={"a"}
          className={clsx(styles.x, styles["google-button"])}
          decorator={<GoogleIcon />}
          href={`${process.env.NEXT_PUBLIC_API_URL}/v1/auth/external/google`}
          size={"lg"}
        >
          Continue with Google
        </Button>
      </div>
      <Spacer orientation={"vertical"} size={3} />
      <Grow />
      <footer
        className={clsx(
          css["flex-col"],
          css["flex-center"],
          css["t-minor"],
          styles.footer
        )}
      >
        <Link
          className={css["t-medium"]}
          href={"#"}
          level={"body2"}
          onClick={(event): void => {
            event.preventDefault();
            set_state({ segment: "recovery_base" });
          }}
          underline={"always"}
        >
          Recover your account
        </Link>
        <Typography level={"body3"}>
          You agree to the Storiny’s{" "}
          <Link href={"/terms"} underline={"always"}>
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href={"/privacy"} underline={"always"}>
            Privacy Statement
          </Link>{" "}
          by proceeding.
        </Typography>
      </footer>
    </>
  );
};

export default Page;
