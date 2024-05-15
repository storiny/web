type SettingsSegment = "general" | "appearance" | "sidebars" | "connections";
type ContentSegment =
  | "pending-stories"
  | "published-stories"
  | "editors"
  | "writers"
  | "newsletter";
type StatsSegment = "stories" | "newsletter";
type AdvancedSegment = "integrations" | "seo" | "domain";

export type BlogDashboardSegment =
  | `settings/${SettingsSegment}`
  | `content/${ContentSegment}`
  | `stats/${StatsSegment}`
  | `advanced/${AdvancedSegment}`;
