import { GetCredentialSettingsResponse } from "~/common/grpc";

export type PasswordSettingsProps = Pick<
  GetCredentialSettingsResponse,
  "has_password"
>;
