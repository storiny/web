import { GetUserCredentialsResponse } from "~/common/grpc";

export type TwoFactorAuthSettingsProps = Pick<
  GetUserCredentialsResponse,
  "is_2fa_enabled" | "has_password"
>;
