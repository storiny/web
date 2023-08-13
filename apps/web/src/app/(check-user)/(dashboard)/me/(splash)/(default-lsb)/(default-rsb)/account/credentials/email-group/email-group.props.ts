import { GetCredentialSettingsResponse } from "~/common/grpc";
import { SubmitHandler } from "~/components/Form";

import { EmailSettingsSchema } from "./email-group.schema";

export type EmailGroupProps = Pick<
  GetCredentialSettingsResponse,
  "has_password"
> & {
  onSubmit?: SubmitHandler<EmailSettingsSchema>;
};
