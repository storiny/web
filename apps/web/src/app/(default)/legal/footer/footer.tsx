import { clsx } from "clsx";
import React from "react";

import Grow from "~/components/grow";
import Link from "~/components/link";
import Typography from "~/components/typography";
import MessagesIcon from "~/icons/messages";

import styles from "./footer.module.scss";

const LegalFooter = (): React.ReactElement => (
  <footer className={clsx("flex-center", styles.footer)}>
    <Typography className={"t-minor"} level={"body2"}>
      Legal &copy; {new Date().getFullYear()} Storiny
    </Typography>
    <Grow />
    <Link
      className={clsx("flex-center", styles.x, styles["support-link"])}
      color={"beryl"}
      href={"/support"}
      level={"body2"}
    >
      <MessagesIcon />
      Contact support
    </Link>
  </footer>
);

export default LegalFooter;
