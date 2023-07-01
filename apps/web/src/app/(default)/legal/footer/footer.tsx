import { clsx } from "clsx";
import React from "react";

import Grow from "~/components/Grow";
import Link from "~/components/Link";
import Typography from "~/components/Typography";
import MessagesIcon from "~/icons/Messages";

import styles from "./footer.module.scss";

const LegalFooter = (): React.ReactElement => (
  <footer className={clsx("flex-center", styles.footer)}>
    <Typography className={"t-minor"} level={"body2"}>
      Legal &copy; {new Date().getFullYear()} Storiny
    </Typography>
    <Grow />
    <Link
      className={clsx("flex-center", styles["support-link"])}
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
