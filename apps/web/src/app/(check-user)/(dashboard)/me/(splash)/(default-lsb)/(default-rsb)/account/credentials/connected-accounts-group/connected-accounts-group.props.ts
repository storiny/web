import { GetUserCredentialsResponse } from "~/common/grpc";

export type ConnectedAccountsGroupProps = Pick<
  GetUserCredentialsResponse,
  "has_password" | "login_google_id" | "login_apple_id"
>;
