import { clsx } from "clsx";
import React from "react";

import Grow from "~/components/grow";
import Link from "~/components/link";
import Typography from "~/components/typography";
import MessagesIcon from "~/icons/messages";
import css from "~/theme/main.module.scss";

import styles from "./footer.module.scss";

const LegalFooter = (): React.ReactElement => (
  <footer className={clsx(css["flex-center"], styles.footer)}>
    <Typography className={css["t-minor"]} level={"body2"}>
      Legal &copy; {new Date().getFullYear()} Storiny
    </Typography>
    <Grow />
    <Link
      className={clsx(css["flex-center"], styles.x, styles["support-link"])}
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
