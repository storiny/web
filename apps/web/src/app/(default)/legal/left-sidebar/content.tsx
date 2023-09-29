"use client";

import clsx from "clsx";
import NextLink from "next/link";
import { useSelectedLayoutSegments } from "next/navigation";
import React from "react";

import ScrollArea from "../../../../../../../packages/ui/src/components/scroll-area";
import Tab, {
  TabProps
} from "../../../../../../../packages/ui/src/components/tab";
import Tabs from "../../../../../../../packages/ui/src/components/tabs";
import TabsList from "../../../../../../../packages/ui/src/components/tabs-list";
import Typography from "../../../../../../../packages/ui/src/components/typography";

import { LegalSegment } from "../types";
import styles from "./left-sidebar.module.scss";

const AnchorTab = ({
  value,
  ...rest
}: Omit<TabProps, "value"> & {
  value: LegalSegment;
}): React.ReactElement => (
  <Tab
    {...rest}
    aria-controls={undefined}
    aria-selected={undefined}
    as={NextLink}
    className={clsx(styles.x, styles.tab)}
    href={`/legal/${value}`}
    id={value}
    role={undefined}
    value={value}
  />
);

// Terms group

const TermsGroup = (): React.ReactElement => (
  <div className={clsx("flex-col", styles.x, styles["tabs-group"])}>
    <Typography className={"t-bold"}>Storiny Terms</Typography>
    <div className={clsx("flex-col", styles.x, styles["tabs-group-container"])}>
      <AnchorTab value={"terms/tos"}>Terms of Service</AnchorTab>
      <AnchorTab value={"terms/community-guidelines"}>
        Community Guidelines
      </AnchorTab>
    </div>
  </div>
);

// Policies group

const PoliciesGroup = (): React.ReactElement => (
  <div className={clsx("flex-col", styles.x, styles["tabs-group"])}>
    <Typography className={"t-bold"}>Storiny Policies</Typography>
    <div className={clsx("flex-col", styles.x, styles["tabs-group-container"])}>
      <AnchorTab value={"policies/privacy"}>Privacy Policy</AnchorTab>
      <AnchorTab value={"policies/username"}>Username Policy</AnchorTab>
      <AnchorTab value={"policies/logo"}>Logo Policy</AnchorTab>
      <AnchorTab value={"policies/trademark"}>Trademark Policy</AnchorTab>
      <AnchorTab value={"policies/government-takedown"}>
        Government Takedown Policy
      </AnchorTab>
      <AnchorTab value={"policies/dmca"}>DMCA Takedown Policy</AnchorTab>
      <AnchorTab value={"policies/content-removal"}>
        Content Removal Policy
      </AnchorTab>
    </div>
  </div>
);

// Acceptable use policies group

const AcceptableUsePoliciesGroup = (): React.ReactElement => (
  <div className={clsx("flex-col", styles.x, styles["tabs-group"])}>
    <Typography className={"t-bold"}>Acceptable Use Policies</Typography>
    <div className={clsx("flex-col", styles.x, styles["tabs-group-container"])}>
      <AnchorTab value={"use-policies/general"}>General</AnchorTab>
      <AnchorTab value={"use-policies/bullying"}>
        Bullying and Harassment
      </AnchorTab>
      <AnchorTab value={"use-policies/disturbing-ux"}>
        Disturbing User Experience
      </AnchorTab>
      <AnchorTab value={"use-policies/doxxing"}>
        Doxxing and Invasion of Privacy
      </AnchorTab>
      <AnchorTab value={"use-policies/hate-speech"}>
        Hate Speech and Discrimination
      </AnchorTab>
      <AnchorTab value={"use-policies/impersonation"}>Impersonation</AnchorTab>
      <AnchorTab value={"use-policies/misinformation"}>
        Misinformation
      </AnchorTab>
      <AnchorTab value={"use-policies/obscene-content"}>
        Sexually Obscene Content
      </AnchorTab>
      <AnchorTab value={"use-policies/violent-content"}>
        Violent Threats and Content
      </AnchorTab>
      <AnchorTab value={"use-policies/appeal-and-reinstatement"}>
        Appeal and Reinstatement
      </AnchorTab>
    </div>
  </div>
);

// Miscellaneous group

const MiscellaneousGroup = (): React.ReactElement => (
  <div className={clsx("flex-col", styles.x, styles["tabs-group"])}>
    <Typography className={"t-bold"}>Miscellaneous</Typography>
    <div className={clsx("flex-col", styles.x, styles["tabs-group-container"])}>
      <AnchorTab value={"miscellaneous/acknowledgements"}>
        Acknowledgements
      </AnchorTab>
    </div>
  </div>
);

const SuspendedLegalLeftSidebarContent = (): React.ReactElement => {
  const segments = useSelectedLayoutSegments();
  segments.shift(); // Remove (mdx) layout
  const currentSegment = segments.join("/");

  React.useEffect(() => {
    // Scroll selected segment tab into view on mount
    const currentSegmentElement = document.getElementById(currentSegment);
    if (currentSegmentElement) {
      currentSegmentElement.scrollIntoView({
        block: "center",
        behavior: "smooth"
      });
    }
  }, [currentSegment]);

  return (
    <Tabs
      activationMode={"manual"}
      as={ScrollArea}
      className={clsx("full-w", styles.x, styles.tabs)}
      orientation={"vertical"}
      role={undefined}
      slot_props={{
        viewport: {
          className: clsx(styles.x, styles.viewport)
        },
        scrollbar: {
          style: { zIndex: 1, backgroundColor: "transparent" }
        }
      }}
      value={currentSegment}
    >
      <TabsList
        aria-orientation={undefined}
        as={"nav"}
        className={clsx("full-w", styles.x, styles["tabs-list"])}
        loop={false}
        role={undefined}
      >
        <TermsGroup />
        <PoliciesGroup />
        <AcceptableUsePoliciesGroup />
        <MiscellaneousGroup />
      </TabsList>
    </Tabs>
  );
};

export default SuspendedLegalLeftSidebarContent;
