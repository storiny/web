import { GetCredentialsResponse } from "~/common/grpc";

export type TwoFactorAuthSettingsProps = Pick<
  GetCredentialsResponse,
  "mfa_enabled" | "has_password"
>;
