import { GetCredentialsResponse } from "~/common/grpc";

export type ConnectedAccountsGroupProps = Pick<
  GetCredentialsResponse,
  "has_password" | "login_google_id" | "login_apple_id"
>;
