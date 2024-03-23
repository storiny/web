import { GetCredentialSettingsResponse } from "~/common/grpc";

export type ConnectedAccountsGroupProps = Pick<
  GetCredentialSettingsResponse,
  "has_password" | "login_google_id" | "login_apple_id"
>;
