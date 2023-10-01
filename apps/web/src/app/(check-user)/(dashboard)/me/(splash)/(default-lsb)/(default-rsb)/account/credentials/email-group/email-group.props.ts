import { GetCredentialSettingsResponse } from "~/common/grpc";
import { SubmitHandler } from "~/components/form";

import { EmailSettingsSchema } from "./email-group.schema";

export type EmailGroupProps = Pick<
  GetCredentialSettingsResponse,
  "has_password"
> & {
  on_submit?: SubmitHandler<EmailSettingsSchema>;
};
