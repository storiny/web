"use client";

import clsx from "clsx";
import NextLink from "next/link";
import React from "react";

import Wordmark from "~/brand/wordmark";
import Button from "~/components/button";
import Divider from "~/components/divider";
import Grow from "~/components/grow";
import IconButton from "~/components/icon-button";
import Link, { LinkProps } from "~/components/link";
import Typography from "~/components/typography";
import PencilPlusIcon from "~/icons/pencil-plus";
import TwitterIcon from "~/icons/twitter";
import css from "~/theme/main.module.scss";

import styles from "./footer.module.scss";
import { FooterProps } from "./footer.props";

// List

const List = ({
  children
}: {
  children: React.ReactNode;
}): React.ReactElement => (
  <ul className={clsx(css["flex-col"], styles.list)}>{children}</ul>
);

// List item

const ListItem = ({ children, ...rest }: LinkProps): React.ReactElement => (
  <li>
    <Link {...rest}>{children}</Link>
  </li>
);

const Footer = (props: FooterProps): React.ReactElement => {
  const { className, children, ...rest } = props;

  React.useLayoutEffect(() => {
    document.body.classList.add("footer");
    return () => document.body.classList.remove("footer");
  }, []);

  return (
    <footer
      {...rest}
      className={clsx(styles.footer, className)}
      data-global-footer={"true"}
    >
      <div className={clsx(css["flex-col"], styles.container)}>
        {Boolean(children) && (
          <React.Fragment>
            {children}
            <Divider />
          </React.Fragment>
        )}
        <div className={clsx(styles.content)}>
          <div className={clsx(css["flex-col"], styles.branding)}>
            <Wordmark
              aria-label={"Go to homepage"}
              as={NextLink}
              className={clsx(styles.wordmark, css["focusable"])}
              href={"/"}
            />
            <Typography className={clsx(styles.tagline)} level={"body2"}>
              The story within you.
            </Typography>
            <Button
              aria-label={"Write a new story"}
              as={NextLink}
              auto_size
              check_auth
              decorator={<PencilPlusIcon />}
              href={"/new"}
            >
              Write
            </Button>
          </div>
          <Grow className={styles.grow} />
          <div className={clsx(css["flex-col"], styles["list-container"])}>
            <Typography className={styles["list-heading"]} level={"body2"}>
              Directories
            </Typography>
            <List>
              <ListItem href={"/"} level={"body2"}>
                Your feed
              </ListItem>
              <ListItem href={"/explore"} level={"body2"}>
                Categories
              </ListItem>
              <ListItem href={"/explore?tab=stories"} level={"body2"}>
                Popular stories
              </ListItem>
              <ListItem href={"/explore?tab=tags"} level={"body2"}>
                Tags
              </ListItem>
            </List>
          </div>
          <div className={clsx(css["flex-col"], styles["list-container"])}>
            <Typography className={styles["list-heading"]} level={"body2"}>
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
          <div className={clsx(css["flex-col"], styles["list-container"])}>
            <Typography className={styles["list-heading"]} level={"body2"}>
              Help
            </Typography>
            <List>
              <ListItem
                href={"mailto:support@storiny.com"}
                level={"body2"}
                target={"_blank"}
              >
                Help center
              </ListItem>
              <ListItem href={"/legal"} level={"body2"}>
                Legal
              </ListItem>
              <ListItem
                href={"mailto:support@storiny.com"}
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
          <Typography className={css["t-minor"]} level={"body2"}>
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
