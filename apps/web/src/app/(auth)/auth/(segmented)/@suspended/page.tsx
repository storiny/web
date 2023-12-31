import { clsx } from "clsx";
import NextLink from "next/link";
import React from "react";

import Button from "~/components/button";
import Grow from "~/components/grow";
import Link from "~/components/link";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import css from "~/theme/main.module.scss";

const Page = (): React.ReactElement => (
  <>
    <Typography as={"h1"} level={"h3"}>
      Account suspended
    </Typography>
    <Spacer orientation={"vertical"} size={0.5} />
    <Typography className={css["t-minor"]} level={"body2"}>
      We have permanently suspended your account for violating our community
      guidelines. If you believe there has been an error in our decision, you
      may{" "}
      <Link href={"/report"} underline={"always"}>
        submit an appeal
      </Link>
      .
      <br />
      <br />
      You can obtain a copy of your account data by submitting a request to our
      support team at{" "}
      <Link href={"mailto:support@storiny.com"} underline={"always"}>
        support@storiny.com
      </Link>
      .
    </Typography>
    <Grow />
    <footer className={clsx(css["flex-col"], css["flex-center"])}>
      <Link
        className={css["t-medium"]}
        href={"mailto:support@storiny.com"}
        level={"body2"}
        underline={"always"}
      >
        File an appeal
      </Link>
      <Spacer orientation={"vertical"} size={3} />
      <Button
        as={NextLink}
        className={css["full-w"]}
        href={"/"}
        size={"lg"}
        variant={"hollow"}
      >
        Home
      </Button>
    </footer>
  </>
);

export default Page;
