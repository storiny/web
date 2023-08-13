import { GetPrivacySettingsResponse } from "~/common/grpc";
import { SubmitHandler } from "~/components/Form";

import { PrivateAccountSchema } from "./private-account.schema";

export type PrivateAccountProps = {
  onSubmit?: SubmitHandler<PrivateAccountSchema>;
} & Pick<GetPrivacySettingsResponse, "is_private_account">;
