import { clsx } from "clsx";
import NextLink from "next/link";
import React from "react";

import Button from "~/components/button";
import Grow from "~/components/grow";
import Link from "~/components/link";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";

const Page = (): React.ReactElement => (
  <>
    <Typography as={"h1"} level={"h3"}>
      Account suspended
    </Typography>
    <Spacer orientation={"vertical"} size={0.5} />
    <Typography className={"t-minor"} level={"body2"}>
      We regret to inform you that your account has been permanently suspended
      for violating our community guidelines. However, if you believe there has
      been an error in our decision, you may{" "}
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
    <footer className={clsx("flex-col", "flex-center")}>
      <Link
        className={"t-medium"}
        href={"/support"}
        level={"body2"}
        underline={"always"}
      >
        File an appeal
      </Link>
      <Spacer orientation={"vertical"} size={3} />
      <Button
        as={NextLink}
        className={"full-w"}
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
