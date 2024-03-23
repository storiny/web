import { GetCredentialSettingsResponse } from "~/common/grpc";

export type TwoFactorAuthSettingsProps = Pick<
  GetCredentialSettingsResponse,
  "mfa_enabled" | "has_password"
>;
