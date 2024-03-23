import React from "react";

import BrushIcon from "~/icons/brush";
import ConnectionsIcon from "~/icons/connections";
import NewsletterIcon from "~/icons/newsletter";
import NewsletterMetricsIcon from "~/icons/newsletter-metrics";
import PackageIcon from "~/icons/package";
import PencilIcon from "~/icons/pencil";
import SearchIcon from "~/icons/search";
import SettingsIcon from "~/icons/settings";
import SidebarIcon from "~/icons/sidebar";
import StoriesMetricsIcon from "~/icons/stories-metrics";
import StoryIcon from "~/icons/story";
import UserPenIcon from "~/icons/user-pen";
import UsersIcon from "~/icons/users";
import WorldIcon from "~/icons/world";

import { Group } from "../../common/left-sidebar";
import { BlogDashboardSegment } from "./types";

// Settings group

const SETTINGS_GROUP: Group<BlogDashboardSegment> = {
  title: "Settings",
  items: [
    {
      decorator: <SettingsIcon />,
      title: "General",
      value: "settings/general"
    },
    {
      decorator: <BrushIcon />,
      title: "Appearance",
      value: "settings/appearance"
    },
    {
      decorator: <SidebarIcon />,
      title: "Sidebars",
      value: "settings/sidebars"
    },
    {
      decorator: <ConnectionsIcon />,
      title: "Connections",
      value: "settings/connections"
    }
  ]
};

// Content group

const SITE_SETTINGS_GROUP: Group<BlogDashboardSegment> = {
  title: "Content",
  items: [
    {
      title: "Pending stories",
      value: "content/pending-stories",
      decorator: <PencilIcon />
    },
    {
      title: "Published stories",
      decorator: <StoryIcon />,
      value: "content/published-stories"
    },
    {
      title: "Editors",
      decorator: <UserPenIcon />,
      value: "content/editors",
      metadata: {
        owner_only: true
      }
    },
    {
      title: "Writers",
      decorator: <UsersIcon />,
      value: "content/writers"
    },
    {
      title: "Newsletter",
      decorator: <NewsletterIcon />,
      value: "content/newsletter"
    }
  ]
};

// Stats group

const STATS_GROUP: Group<BlogDashboardSegment> = {
  title: "Stats",
  items: [
    {
      title: "Stories stats",
      value: "stats/stories",
      decorator: <StoriesMetricsIcon />
    },
    {
      title: "Newsletter stats",
      value: "stats/newsletter",
      decorator: <NewsletterMetricsIcon />
    }
  ]
};

// Advanced group

const MODERATION_GROUP: Group<BlogDashboardSegment> = {
  title: "Advanced",
  items: [
    {
      title: "Integrations",
      value: "advanced/integrations",
      decorator: <PackageIcon />
    },
    {
      title: "Search optimization",
      value: "advanced/seo",
      decorator: <SearchIcon />
    },
    {
      title: "Domain",
      value: "advanced/domain",
      decorator: <WorldIcon />
    }
  ]
};

export const BLOG_DASHBOARD_GROUPS: Group<BlogDashboardSegment>[] = [
  SETTINGS_GROUP,
  SITE_SETTINGS_GROUP,
  STATS_GROUP,
  MODERATION_GROUP
];
