"use client";

import clsx from "clsx";
import NextLink from "next/link";
import React from "react";

import Wordmark from "~/brand/Wordmark";
import Button from "~/components/Button";
import Divider from "~/components/Divider";
import Grow from "~/components/Grow";
import IconButton from "~/components/IconButton";
import Link, { LinkProps } from "~/components/Link";
import Typography from "~/components/Typography";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import PencilPlusIcon from "~/icons/PencilPlus";
import TwitterIcon from "~/icons/Twitter";
import { breakpoints } from "~/theme/breakpoints";

import styles from "./Footer.module.scss";
import { FooterProps } from "./Footer.props";

const WriteButton = (): React.ReactElement => {
  const sizeLg = useMediaQuery(breakpoints.down("mobile"));

  return (
    <Button
      aria-label={"Write a new story"}
      as={NextLink}
      checkAuth
      decorator={<PencilPlusIcon />}
      href={"/new"}
      size={sizeLg ? "lg" : "md"}
    >
      Write
    </Button>
  );
};

// List

const List = ({
  children
}: {
  children: React.ReactNode;
}): React.ReactElement => (
  <ul className={clsx("flex-col", styles.list)}>{children}</ul>
);

// List item

const ListItem = ({ children, ...rest }: LinkProps): React.ReactElement => (
  <li>
    <Link {...rest}>{children}</Link>
  </li>
);

const Footer = (props: FooterProps): React.ReactElement => {
  const { className, ...rest } = props;
  return (
    <footer {...rest} className={clsx(styles.footer, className)}>
      <div className={clsx("flex-col", styles.container)}>
        <div className={clsx(styles.content)}>
          <div className={clsx("flex-col", styles.branding)}>
            <Wordmark
              aria-label={"Go to homepage"}
              as={NextLink}
              className={clsx(styles.wordmark, "focusable")}
              href={"/"}
            />
            <Typography className={clsx(styles.tagline)} level={"body2"}>
              The story within you.
            </Typography>
            <WriteButton />
          </div>
          <Grow className={clsx(styles.grow)} />
          <div className={clsx("flex-col", styles["list-container"])}>
            <Typography
              className={clsx(styles["list-heading"])}
              level={"body2"}
            >
              Directories
            </Typography>
            <List>
              <ListItem href={"/"} level={"body2"}>
                Your feed
              </ListItem>
              <ListItem href={"/explore"} level={"body2"}>
                Categories
              </ListItem>
              <ListItem href={"/explore?sort=popular"} level={"body2"}>
                Popular stories
              </ListItem>
              <ListItem href={"/tags"} level={"body2"}>
                Tags
              </ListItem>
            </List>
          </div>
          <div className={clsx("flex-col", styles["list-container"])}>
            <Typography
              className={clsx(styles["list-heading"])}
              level={"body2"}
            >
              Company
            </Typography>
            <List>
              <ListItem href={"/about"} level={"body2"}>
                About us
              </ListItem>
              <ListItem href={"/terms"} level={"body2"}>
                Terms of use
              </ListItem>
              <ListItem href={"/privacy"} level={"body2"}>
                Privacy policy
              </ListItem>
              <ListItem href={"/branding"} level={"body2"}>
                Media kit
              </ListItem>
              <ListItem
                href={"https://status.storiny.com"}
                level={"body2"}
                target={"_blank"}
              >
                Service status
              </ListItem>
            </List>
          </div>
          <div className={clsx("flex-col", styles["list-container"])}>
            <Typography
              className={clsx(styles["list-heading"])}
              level={"body2"}
            >
              Help
            </Typography>
            <List>
              <ListItem
                href={"https://help.storiny.com"}
                level={"body2"}
                target={"_blank"}
              >
                Help center
              </ListItem>
              <ListItem href={"/legal"} level={"body2"}>
                Legal
              </ListItem>
              <ListItem
                href={"https://help.storiny.com/contact"}
                level={"body2"}
                target={"_blank"}
              >
                Contact us
              </ListItem>
            </List>
          </div>
        </div>
        <Divider />
        <div className={clsx(styles.copyright)}>
          <Typography className={"t-minor"} level={"body2"}>
            © {new Date().getFullYear()} Storiny. All rights reserved.
          </Typography>
          <IconButton
            aria-label={"Storiny on Twitter"}
            as={"a"}
            href={"https://twitter.com/storiny_intl"}
            rel={"noreferrer"}
            target={"_blank"}
            title={"Storiny on Twitter"}
            variant={"ghost"}
          >
            <TwitterIcon />
          </IconButton>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
