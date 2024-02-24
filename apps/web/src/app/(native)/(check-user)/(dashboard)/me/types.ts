type AccountSegment =
  | "profile"
  | "credentials"
  | "privacy"
  | "notifications"
  | "connections"
  | "login-activity";
type SiteSettingsSegment = "appearance" | "accessibility";
type ContentSegment =
  | "drafts"
  | "stories"
  | "contributions"
  | "responses"
  | "tags"
  | "relations";
type StatsSegment = "account" | "stories";
type ModerationSegment = "blocks" | "mutes";
type MiscellaneousSegment = "activity" | "resources";

export type DashboardSegment =
  | `account/${AccountSegment}`
  | `settings/${SiteSettingsSegment}`
  | `content/${ContentSegment}`
  | `stats/${StatsSegment}`
  | `moderation/${ModerationSegment}`
  | `miscellaneous/${MiscellaneousSegment}`;
