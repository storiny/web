"use client";

import { use_blog_context } from "@storiny/web/src/common/context/blog";
import React from "react";

import Link from "~/components/link";
import Typography from "~/components/typography";

import styles from "./footer.module.scss";

const RightSidebarFooter = ({
  is_blog
}: {
  is_blog?: boolean;
}): React.ReactElement => {
  const blog = use_blog_context();
  const link_prefix = blog?.id ? process.env.NEXT_PUBLIC_WEB_URL : "";

  return (
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
        <>
          <Link href={"/membership"} level={"body3"}>
            Storiny+
          </Link>
          <Link href={"/branding"} level={"body3"}>
            Brand
          </Link>
        </>
      )}
      <Link
        href={process.env.NEXT_PUBLIC_STATUS_PAGE_URL || "/"}
        level={"body3"}
      >
        Service status
      </Link>
      <Link href={`${link_prefix}/privacy`} level={"body3"}>
        Privacy
      </Link>
      <Link href={`${link_prefix}/terms`} level={"body3"}>
        Terms
      </Link>
      <Link href={`${link_prefix}/cookies`} level={"body3"}>
        Cookies
      </Link>
      <Link href={"mailto:support@storiny.com"} level={"body3"}>
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
};

export default RightSidebarFooter;
