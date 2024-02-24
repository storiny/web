import { GetPrivacySettingsResponse } from "~/common/grpc";
import { SubmitHandler } from "~/components/form";

import { PrivateAccountSchema } from "./private-account.schema";

export type PrivateAccountProps = {
  on_submit?: SubmitHandler<PrivateAccountSchema>;
} & Pick<GetPrivacySettingsResponse, "is_private_account">;
