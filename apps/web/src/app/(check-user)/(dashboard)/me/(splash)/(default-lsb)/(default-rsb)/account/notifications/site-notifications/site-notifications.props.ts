import { GetNotificationSettingsResponse } from "~/common/grpc";
import { SubmitHandler } from "~/components/Form";

import { SiteNotificationsSchema } from "./site-notifications.schema";

export type SiteNotificationsProps = {
  onSubmit?: SubmitHandler<SiteNotificationsSchema>;
} & Omit<
  GetNotificationSettingsResponse,
  | "mail_newsletters"
  | "mail_features_and_updates"
  | "mail_digest"
  | "mail_login_activity"
>;
