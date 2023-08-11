import { GetUserCredentialsResponse } from "~/common/grpc";

export type TwoFactorAuthSettingsProps = Pick<
  GetUserCredentialsResponse,
  "mfa_enabled" | "has_password"
>;
