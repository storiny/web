import { clsx } from "clsx";
import React from "react";

import Grow from "../../../../../../../packages/ui/src/components/grow";
import Link from "../../../../../../../packages/ui/src/components/link";
import Typography from "../../../../../../../packages/ui/src/components/typography";
import MessagesIcon from "~/icons/Messages";

import styles from "./footer.module.scss";

const LegalFooter = (): React.ReactElement => (
  <footer className={clsx("flex-center", styles.x, styles.footer)}>
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
