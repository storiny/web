"use client";

import { clsx } from "clsx";
import NextLink from "next/link";
import React from "react";

import Button from "~/components/button";
import Spacer from "~/components/spacer";
import Spinner from "~/components/spinner";
import Typography from "~/components/typography";
import css from "~/theme/main.module.scss";

const Client = ({
  verify_login
}: {
  verify_login: () => Promise<boolean>;
}): React.ReactElement => {
  const [state, set_state] = React.useState<"loading" | "invalid_token">(
    "loading"
  );

  React.useEffect(() => {
    verify_login().then((res) => {
      if (!res) {
        set_state("invalid_token");
      }
    });
  }, [verify_login]);

  return state === "loading" ? (
    <div
      className={clsx(css["flex-col"], css["flex-center"])}
      style={{ margin: "auto" }}
    >
      <Spinner size={"lg"} />
    </div>
  ) : (
    <>
      <Typography as={"h1"} level={"h2"} style={{ textAlign: "center" }}>
        Invalid or expired login token
      </Typography>
      <Spacer className={css["f-grow"]} orientation={"vertical"} size={2} />
      <div className={clsx(css["flex-col"], css["flex-center"])}>
        <Button as={NextLink} className={css["full-w"]} href={"/"} size={"lg"}>
          Home
        </Button>
      </div>
    </>
  );
};

export default Client;
