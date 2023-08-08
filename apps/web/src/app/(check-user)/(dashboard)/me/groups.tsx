import Fuse from "fuse.js";
import React from "react";

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
import ShieldIcon from "~/icons/Shield";
import StoriesMetricsIcon from "~/icons/StoriesMetrics";
import StoryIcon from "~/icons/Story";
import TagsIcon from "~/icons/Tags";
import UserIcon from "~/icons/User";
import UserMetricsIcon from "~/icons/UserMetrics";
import UsersIcon from "~/icons/Users";

import { DashboardSegment } from "./types";

export interface Group {
  items: {
    decorator: React.ReactElement;
    title: string;
    value: DashboardSegment;
  }[];
  title: string;
}

// Account group

const accountGroup: Group = {
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

const siteSettingsGroup: Group = {
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

const contentGroup: Group = {
  title: "Your content",
  items: [
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

const statsGroup: Group = {
  title: "Your stats",
  items: [
    {
      title: "Account metrics",
      value: "stats/account",
      decorator: <UserMetricsIcon />
    },
    {
      title: "Stories metrics",
      value: "stats/stories",
      decorator: <StoriesMetricsIcon />
    }
  ]
};

// Moderation group

const moderationGroup: Group = {
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

const miscellaneousGroup: Group = {
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

export const dashboardGroups: Group[] = [
  accountGroup,
  siteSettingsGroup,
  contentGroup,
  statsGroup,
  moderationGroup,
  miscellaneousGroup
];

// Searching items

const dashboardFuse = new Fuse<Group>(dashboardGroups, {
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

/**
 * Returns the groups with items matching the provided text
 * @param query Query
 */
export const searchDashboardGroups = (query: string): Group[] => {
  const results = dashboardFuse.search(query);
  return results.map(
    (result) =>
      ({
        ...result.item,
        items: result.item.items.filter(
          (item) =>
            result.matches &&
            result.matches.some((match) => match.value === item.title)
        )
      } as Group)
  );
};
