"use client";

import clsx from "clsx";
import NextLink from "next/link";
import React from "react";

import NavigationItem from "~/components/NavigationItem";
import Separator from "~/components/Separator";
import Spacer from "~/components/Spacer";
import ExternalLinkIcon from "~/icons/ExternalLink";

import DashboardTitle from "../../../dashboard-title";
import DashboardWrapper from "../../../dashboard-wrapper";
import styles from "./styles.module.scss";

const MiscellaneousResourcesClient = (): React.ReactElement => (
  <React.Fragment>
    <DashboardTitle>Additional resources</DashboardTitle>
    <DashboardWrapper className={clsx(styles.x, styles.wrapper)}>
      <div className={clsx("flex-col", styles.x, styles.container)}>
        {[
          ["About", "/about"],
          ["Media kit", "/branding"],
          ["Service Status", "/status"],
          ["Help center", "/help"]
        ].map(([title, href]) => (
          <React.Fragment key={href}>
            <NavigationItem
              as={NextLink}
              endDecorator={<ExternalLinkIcon />}
              href={href}
              target={"_blank"}
            >
              {title}
            </NavigationItem>
            <Separator className={"hide-last"} invertMargin />
          </React.Fragment>
        ))}
      </div>
      <div className={clsx("flex-col", styles.x, styles.container)}>
        {[
          ["Privacy Policy", "/legal/policies/privacy"],
          ["Terms of Use", "/legal/terms/tos"],
          ["Community Guidelines", "/legal/terms/community-guidelines"],
          ["Username Policy", "/legal/policies/username"],
          ["Logo Policy", "/legal/policies/logo"],
          ["Trademark Policy", "/legal/policies/trademark"],
          ["Content Removal Policy", "/legal/policies/content-removal"],
          ["Acceptable Use Policy", "/legal/use-policies/general"]
        ].map(([title, href]) => (
          <React.Fragment key={href}>
            <NavigationItem
              as={NextLink}
              endDecorator={<ExternalLinkIcon />}
              href={href}
              target={"_blank"}
            >
              {title}
            </NavigationItem>
            <Separator className={"hide-last"} invertMargin />
          </React.Fragment>
        ))}
      </div>
    </DashboardWrapper>
    <Spacer orientation={"vertical"} size={10} />
  </React.Fragment>
);

export default MiscellaneousResourcesClient;
