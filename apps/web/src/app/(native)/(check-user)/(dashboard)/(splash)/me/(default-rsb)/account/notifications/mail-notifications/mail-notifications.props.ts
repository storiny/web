import { GetNotificationSettingsResponse } from "~/common/grpc";
import { SubmitHandler } from "~/components/form";

import { MailNotificationsSchema } from "./mail-notifications.schema";

export type MailNotificationsProps = {
  on_submit?: SubmitHandler<MailNotificationsSchema>;
} & Pick<
  GetNotificationSettingsResponse,
  | "mail_newsletters"
  | "mail_features_and_updates"
  | "mail_digest"
  | "mail_login_activity"
>;
