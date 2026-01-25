import Fuse from "fuse.js";
import React from "react";

import AccessibilityIcon from "~/icons/accessibility";
import BanIcon from "~/icons/ban";
import BellIcon from "~/icons/bell";
import BlogIcon from "~/icons/blog";
import BooksIcon from "~/icons/books";
import BrushIcon from "~/icons/brush";
import CommentIcon from "~/icons/comment";
import ConnectionsIcon from "~/icons/connections";
import ContributionIcon from "~/icons/contribution";
import KeyIcon from "~/icons/key";
import LoginIcon from "~/icons/login";
import MuteIcon from "~/icons/mute";
import PencilIcon from "~/icons/pencil";
import ScriptIcon from "~/icons/script";
import ShieldIcon from "~/icons/shield";
import StoriesMetricsIcon from "~/icons/stories-metrics";
import StoryIcon from "~/icons/story";
import TagsIcon from "~/icons/tags";
import UserIcon from "~/icons/user";
import UserMetricsIcon from "~/icons/user-metrics";
import UsersIcon from "~/icons/users";

import { Group } from "../common/left-sidebar";
import { DashboardSegment } from "./types";

// Account group

const ACCOUNT_GROUP: Group<DashboardSegment> = {
  title: "Your account",
  items: [
    {
      decorator: <UserIcon />,
      title: "Public profile",
      value: "account/profile"
    },
    {
      decorator: <KeyIcon />,
      title: "Credentials",
      value: "account/credentials"
    },
    {
      decorator: <ShieldIcon />,
      title: "Privacy & safety",
      value: "account/privacy"
    },
    {
      decorator: <BellIcon />,
      title: "Notifications",
      value: "account/notifications"
    },
    {
      decorator: <ConnectionsIcon />,
      title: "Connections",
      value: "account/connections"
    },
    {
      decorator: <LoginIcon />,
      title: "Login activity",
      value: "account/login-activity"
    }
  ]
};

// Site settings group

const SITE_SETTINGS_GROUP: Group<DashboardSegment> = {
  title: "Site settings",
  items: [
    {
      title: "Appearance",
      value: "settings/appearance",
      decorator: <BrushIcon />
    },
    {
      title: "Accessibility",
      decorator: <AccessibilityIcon />,
      value: "settings/accessibility"
    }
  ]
};

// Content group

const CONTENT_GROUP: Group<DashboardSegment> = {
  title: "Your content",
  items: [
    { title: "Blogs", value: "content/blogs", decorator: <BlogIcon /> },
    {
      title: "Drafts",
      value: "content/drafts",
      decorator: <PencilIcon />
    },
    {
      title: "Published stories",
      value: "content/stories",
      decorator: <StoryIcon />
    },
    {
      title: "Contributions",
      value: "content/contributions",
      decorator: <ContributionIcon />
    },
    {
      title: "Responses",
      value: "content/responses",
      decorator: <CommentIcon />
    },
    {
      title: "Followed tags",
      value: "content/tags",
      decorator: <TagsIcon />
    },
    {
      title: "Relations",
      value: "content/relations",
      decorator: <UsersIcon />
    }
  ]
};

// Stats group

const STATS_GROUP: Group<DashboardSegment> = {
  title: "Your stats",
  items: [
    {
      title: "Account stats",
      value: "stats/account",
      decorator: <UserMetricsIcon />
    },
    {
      title: "Stories stats",
      value: "stats/stories",
      decorator: <StoriesMetricsIcon />
    }
  ]
};

// Moderation group

const MODERATION_GROUP: Group<DashboardSegment> = {
  title: "Moderation",
  items: [
    {
      title: "Blocked users",
      value: "moderation/blocks",
      decorator: <BanIcon />
    },
    {
      title: "Muted users",
      value: "moderation/mutes",
      decorator: <MuteIcon />
    }
  ]
};

// Miscellaneous group

const MISCELLANEOUS_GROUP: Group<DashboardSegment> = {
  title: "Miscellaneous",
  items: [
    {
      title: "Account activity",
      value: "miscellaneous/activity",
      decorator: <ScriptIcon />
    },
    {
      title: "Additional resources",
      value: "miscellaneous/resources",
      decorator: <BooksIcon />
    }
  ]
};

export const DASHBOARD_GROUPS: Group<DashboardSegment>[] = [
  ACCOUNT_GROUP,
  SITE_SETTINGS_GROUP,
  CONTENT_GROUP,
  STATS_GROUP,
  MODERATION_GROUP,
  MISCELLANEOUS_GROUP
];

/**
 * Returns dashboard groups fuse
 */
const get_dashboard_groups_fuse = async (): Promise<
  Fuse<Group<DashboardSegment>>
> => {
  const Fuse = (await import("fuse.js")).default;
  return new Fuse<Group<DashboardSegment>>(DASHBOARD_GROUPS, {
    isCaseSensitive: false,
    includeScore: false,
    shouldSort: true,
    includeMatches: true,
    findAllMatches: false,
    minMatchCharLength: 1,
    location: 0,
    threshold: 0.3,
    keys: ["items.title"]
  });
};

/**
 * Returns the groups with items matching the provided text
 * @param query Query
 */
export const search_dashboard_groups = async (
  query: string
): Promise<Group<DashboardSegment>[]> => {
  const dashboard_fuse = await get_dashboard_groups_fuse();
  const results = dashboard_fuse.search(query);

  return results.map(
    (result) =>
      ({
        ...result.item,
        items: result.item.items.filter(
          (item) =>
            result.matches &&
            result.matches.some((match) => match.value === item.title)
        )
      }) as Group<DashboardSegment>
  );
};
