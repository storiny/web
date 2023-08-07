"use client";

import clsx from "clsx";
import NextLink from "next/link";
import { useSelectedLayoutSegments } from "next/navigation";
import React from "react";

import Input from "~/components/Input";
import ScrollArea from "~/components/ScrollArea";
import Separator from "~/components/Separator";
import Spacer from "~/components/Spacer";
import Tab, { TabProps } from "~/components/Tab";
import Tabs from "~/components/Tabs";
import TabsList from "~/components/TabsList";
import Typography from "~/components/Typography";
import Persona from "~/entities/Persona";
import AccessibilityIcon from "~/icons/Accessibility";
import BanIcon from "~/icons/Ban";
import BellIcon from "~/icons/Bell";
import BooksIcon from "~/icons/Books";
import BrushIcon from "~/icons/Brush";
import CommentIcon from "~/icons/Comment";
import ConnectionsIcon from "~/icons/Connections";
import KeyIcon from "~/icons/Key";
import LoginIcon from "~/icons/Login";
import MuteIcon from "~/icons/Mute";
import PencilIcon from "~/icons/Pencil";
import ScriptIcon from "~/icons/Script";
import SearchIcon from "~/icons/Search";
import ShieldIcon from "~/icons/Shield";
import StoriesMetricsIcon from "~/icons/StoriesMetrics";
import StoryIcon from "~/icons/Story";
import TagsIcon from "~/icons/Tags";
import UserIcon from "~/icons/User";
import UserMetricsIcon from "~/icons/UserMetrics";
import UsersIcon from "~/icons/Users";
import { selectUser } from "~/redux/features";
import { useAppSelector } from "~/redux/hooks";

import styles from "./left-sidebar.module.scss";

const AnchorTab = ({
  value,
  ...rest
}: Omit<TabProps, "value"> & {
  // TODO: Typed value
  value: string;
}): React.ReactElement => (
  <Tab
    {...rest}
    aria-controls={undefined}
    aria-selected={undefined}
    as={NextLink}
    className={clsx(styles.x, styles.tab)}
    href={`/me/${value}`}
    id={value}
    role={undefined}
    value={value}
  />
);

// Account group

const AccountGroup = (): React.ReactElement => (
  <div className={clsx("flex-col", styles.x, styles["tabs-group"])}>
    <Typography className={clsx("t-medium", "t-minor")} level={"body2"}>
      Your account
    </Typography>
    <div className={clsx("flex-col", styles.x, styles["tabs-group-container"])}>
      <AnchorTab decorator={<UserIcon />} value={"use-policies/general"}>
        Public profile
      </AnchorTab>
      <AnchorTab decorator={<KeyIcon />} value={"use-policies/bullying"}>
        Credentials
      </AnchorTab>
      <AnchorTab
        decorator={<ShieldIcon />}
        value={"use-policies/disturbing-ux"}
      >
        Privacy & safety
      </AnchorTab>
      <AnchorTab decorator={<BellIcon />} value={"use-policies/doxxing"}>
        Notifications
      </AnchorTab>
      <AnchorTab
        decorator={<ConnectionsIcon />}
        value={"use-policies/hate-speech"}
      >
        Connections
      </AnchorTab>
      <AnchorTab decorator={<LoginIcon />} value={"use-policies/impersonation"}>
        Login activity
      </AnchorTab>
    </div>
  </div>
);

// Site settings group

const SiteSettingsGroup = (): React.ReactElement => (
  <div className={clsx("flex-col", styles.x, styles["tabs-group"])}>
    <Typography className={clsx("t-medium", "t-minor")} level={"body2"}>
      Site settings
    </Typography>
    <div className={clsx("flex-col", styles.x, styles["tabs-group-container"])}>
      <AnchorTab decorator={<BrushIcon />} value={"use-policies/general"}>
        Appearance
      </AnchorTab>
      <AnchorTab
        decorator={<AccessibilityIcon />}
        value={"use-policies/bullying"}
      >
        Accessibility
      </AnchorTab>
    </div>
  </div>
);

// Content group

const ContentGroup = (): React.ReactElement => (
  <div className={clsx("flex-col", styles.x, styles["tabs-group"])}>
    <Typography className={clsx("t-medium", "t-minor")} level={"body2"}>
      Your content
    </Typography>
    <div className={clsx("flex-col", styles.x, styles["tabs-group-container"])}>
      <AnchorTab decorator={<PencilIcon />} value={"use-policies/general"}>
        Drafts
      </AnchorTab>
      <AnchorTab decorator={<StoryIcon />} value={"use-policies/bullying"}>
        Published stories
      </AnchorTab>
      <AnchorTab decorator={<CommentIcon />} value={"use-policies/bullying"}>
        Responses
      </AnchorTab>
      <AnchorTab decorator={<TagsIcon />} value={"use-policies/bullying"}>
        Followed tags
      </AnchorTab>
      <AnchorTab decorator={<UsersIcon />} value={"use-policies/bullying"}>
        Relations
      </AnchorTab>
    </div>
  </div>
);

// Stats group

const StatsGroup = (): React.ReactElement => (
  <div className={clsx("flex-col", styles.x, styles["tabs-group"])}>
    <Typography className={clsx("t-medium", "t-minor")} level={"body2"}>
      Your stats
    </Typography>
    <div className={clsx("flex-col", styles.x, styles["tabs-group-container"])}>
      <AnchorTab decorator={<UserMetricsIcon />} value={"use-policies/general"}>
        Account metrics
      </AnchorTab>
      <AnchorTab
        decorator={<StoriesMetricsIcon />}
        value={"use-policies/bullying"}
      >
        Stories metrics
      </AnchorTab>
    </div>
  </div>
);

// Moderation group

const ModerationGroup = (): React.ReactElement => (
  <div className={clsx("flex-col", styles.x, styles["tabs-group"])}>
    <Typography className={clsx("t-medium", "t-minor")} level={"body2"}>
      Moderation
    </Typography>
    <div className={clsx("flex-col", styles.x, styles["tabs-group-container"])}>
      <AnchorTab decorator={<BanIcon />} value={"use-policies/general"}>
        Blocked users
      </AnchorTab>
      <AnchorTab decorator={<MuteIcon />} value={"use-policies/bullying"}>
        Muted users
      </AnchorTab>
    </div>
  </div>
);

// Miscellaneous group

const MiscellaneousGroup = (): React.ReactElement => (
  <div className={clsx("flex-col", styles.x, styles["tabs-group"])}>
    <Typography className={clsx("t-medium", "t-minor")} level={"body2"}>
      Miscellaneous
    </Typography>
    <div className={clsx("flex-col", styles.x, styles["tabs-group-container"])}>
      <AnchorTab decorator={<ScriptIcon />} value={"use-policies/general"}>
        Account activity
      </AnchorTab>
      <AnchorTab decorator={<BooksIcon />} value={"use-policies/bullying"}>
        Additional resources
      </AnchorTab>
    </div>
  </div>
);

const SuspendedLegalLeftSidebarContent = (): React.ReactElement => {
  const segments = useSelectedLayoutSegments();
  const user = useAppSelector(selectUser)!;
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
    <div className={clsx("flex-col", styles.x, styles["left-sidebar"])}>
      <div className={clsx("flex-col", styles.x, styles.content)}>
        <Persona
          avatar={{
            alt: `${user.name}'s avatar`,
            avatarId: user.avatar_id,
            label: user.name,
            hex: user.avatar_hex
          }}
          className={clsx(styles.x, styles.persona)}
          componentProps={{
            primaryText: {
              className: "ellipsis"
            },
            secondaryText: {
              className: "ellipsis"
            }
          }}
          primaryText={user.name}
          secondaryText={`@${user.username}`}
          size={"lg"}
        />
        <Input
          decorator={<SearchIcon />}
          placeholder={"Search settings"}
          type={"search"}
        />
        <Separator />
      </div>
      <Tabs
        activationMode={"manual"}
        as={ScrollArea}
        className={clsx("full-w", styles.x, styles.tabs)}
        orientation={"vertical"}
        role={undefined}
        slotProps={{
          viewport: {
            className: clsx(styles.x, styles.viewport)
          },
          scrollbar: {
            style: { zIndex: 1 }
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
          <AccountGroup />
          <SiteSettingsGroup />
          <ContentGroup />
          <StatsGroup />
          <ModerationGroup />
          <MiscellaneousGroup />
        </TabsList>
      </Tabs>
      <Spacer orientation={"vertical"} size={2} />
      <div className={clsx("flex-col", styles.x, styles.content)}>
        <Separator />
        <div className={"flex-col"}>
          <Typography className={"t-muted"} level={"body3"}>
            Beta BUILD_ID
          </Typography>
          <Typography className={"t-muted"} level={"body3"}>
            Device OS
          </Typography>
        </div>
      </div>
    </div>
  );
};

export default SuspendedLegalLeftSidebarContent;
