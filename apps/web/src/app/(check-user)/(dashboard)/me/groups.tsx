import Fuse from "fuse.js";
import React from "react";

import AccessibilityIcon from "../../../../../../../packages/ui/src/icons/accessibility";
import BanIcon from "../../../../../../../packages/ui/src/icons/ban";
import BellIcon from "../../../../../../../packages/ui/src/icons/bell";
import BooksIcon from "../../../../../../../packages/ui/src/icons/books";
import BrushIcon from "../../../../../../../packages/ui/src/icons/brush";
import CommentIcon from "../../../../../../../packages/ui/src/icons/comment";
import ConnectionsIcon from "../../../../../../../packages/ui/src/icons/connections";
import KeyIcon from "../../../../../../../packages/ui/src/icons/key";
import LoginIcon from "../../../../../../../packages/ui/src/icons/login";
import MuteIcon from "../../../../../../../packages/ui/src/icons/mute";
import PencilIcon from "../../../../../../../packages/ui/src/icons/pencil";
import ScriptIcon from "../../../../../../../packages/ui/src/icons/script";
import ShieldIcon from "../../../../../../../packages/ui/src/icons/shield";
import StoriesMetricsIcon from "../../../../../../../packages/ui/src/icons/stories-metrics";
import StoryIcon from "../../../../../../../packages/ui/src/icons/story";
import TagsIcon from "../../../../../../../packages/ui/src/icons/tags";
import UserIcon from "../../../../../../../packages/ui/src/icons/user";
import UserMetricsIcon from "../../../../../../../packages/ui/src/icons/user-metrics";
import UsersIcon from "../../../../../../../packages/ui/src/icons/users";
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

const ACCOUNT_GROUP: Group = {
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

const SITE_SETTINGS_GROUP: Group = {
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

const CONTENT_GROUP: Group = {
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

const STATS_GROUP: Group = {
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

const MODERATION_GROUP: Group = {
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

const MISCELLANEOUS_GROUP: Group = {
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

export const DASHBOARD_GROUPS: Group[] = [
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
const get_dashboard_groups_fuse = async (): Promise<Fuse<Group>> => {
  const Fuse = (await import("fuse.js")).default;
  return new Fuse<Group>(DASHBOARD_GROUPS, {
    /* eslint-disable prefer-snakecase/prefer-snakecase */
    isCaseSensitive: false,
    includeScore: false,
    shouldSort: true,
    includeMatches: true,
    findAllMatches: false,
    minMatchCharLength: 1,
    location: 0,
    threshold: 0.3,
    keys: ["items.title"]
    /* eslint-enable prefer-snakecase/prefer-snakecase */
  });
};

/**
 * Returns the groups with items matching the provided text
 * @param query Query
 */
export const search_dashboard_groups = async (
  query: string
): Promise<Group[]> => {
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
      } as Group)
  );
};
