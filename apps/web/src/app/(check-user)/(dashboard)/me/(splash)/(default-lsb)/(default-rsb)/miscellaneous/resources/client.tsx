"use client";

import clsx from "clsx";
import NextLink from "next/link";
import React from "react";

import NavigationItem from "../../../../../../../../../../../../packages/ui/src/components/navigation-item";
import Separator from "../../../../../../../../../../../../packages/ui/src/components/separator";
import Spacer from "../../../../../../../../../../../../packages/ui/src/components/spacer";
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
              end_decorator={<ExternalLinkIcon />}
              href={href}
              target={"_blank"}
            >
              {title}
            </NavigationItem>
            <Separator className={"hide-last"} invert_margin />
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
              end_decorator={<ExternalLinkIcon />}
              href={href}
              target={"_blank"}
            >
              {title}
            </NavigationItem>
            <Separator className={"hide-last"} invert_margin />
          </React.Fragment>
        ))}
      </div>
    </DashboardWrapper>
    <Spacer orientation={"vertical"} size={10} />
  </React.Fragment>
);

export default MiscellaneousResourcesClient;
