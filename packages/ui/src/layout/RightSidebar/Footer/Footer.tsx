import clsx from "clsx";
import React from "react";

import Link from "~/components/Link";
import Typography from "~/components/Typography";

import styles from "./Footer.module.scss";

const RightSidebarFooter = () => (
  <footer className={styles.footer}>
    <Link href={"/about"} level={"body3"}>
      About
    </Link>
    <Link href={"/help"} level={"body3"}>
      Help
    </Link>
    <Link href={"/branding"} level={"body3"}>
      Brand
    </Link>
    <Link href={"/status"} level={"body3"}>
      Service status
    </Link>
    <Link href={"/privacy"} level={"body3"}>
      Privacy
    </Link>
    <Link href={"/terms"} level={"body3"}>
      Terms
    </Link>
    <Link href={"/cookies"} level={"body3"}>
      Cookies
    </Link>
    <Link href={"/contact"} level={"body3"}>
      Contact
    </Link>
    <Typography
      as={"span"}
      className={clsx("t-muted", styles.copyright)}
      level={"body3"}
    >
      &copy; {new Date().getFullYear()} Storiny
    </Typography>
  </footer>
);

export default RightSidebarFooter;
