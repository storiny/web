import clsx from "clsx";
import React from "react";

import Link from "~/components/link";
import Typography from "~/components/typography";
import css from "~/theme/main.module.scss";

import styles from "./footer.module.scss";

const RightSidebarFooter = ({
  is_blog
}: {
  is_blog?: boolean;
}): React.ReactElement => (
  <footer className={styles.footer}>
    {!is_blog && (
      <Link href={"/about"} level={"body3"}>
        About
      </Link>
    )}
    <Link href={"mailto:support@storiny.com"} level={"body3"}>
      Help
    </Link>
    {!is_blog && (
      <Link href={"/branding"} level={"body3"}>
        Brand
      </Link>
    )}
    <Link href={process.env.NEXT_PUBLIC_STATUS_PAGE_URL || "/"} level={"body3"}>
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
      className={styles.copyright}
      color={"muted"}
      level={"body3"}
    >
      &copy; {new Date().getFullYear()} Storiny
    </Typography>
  </footer>
);

export default RightSidebarFooter;
