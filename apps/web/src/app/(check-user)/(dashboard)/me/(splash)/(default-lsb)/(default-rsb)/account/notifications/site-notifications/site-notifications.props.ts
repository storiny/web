import { GetNotificationSettingsResponse } from "~/common/grpc";
import { SubmitHandler } from "../../../../../../../../../../../../../packages/ui/src/components/form";

import { SiteNotificationsSchema } from "./site-notifications.schema";

export type SiteNotificationsProps = {
  on_submit?: SubmitHandler<SiteNotificationsSchema>;
} & Omit<
  GetNotificationSettingsResponse,
  | "mail_newsletters"
  | "mail_features_and_updates"
  | "mail_digest"
  | "mail_login_activity"
>;
