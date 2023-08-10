import { GetUserCredentialsResponse } from "~/common/grpc";

export type PasswordSettingsProps = Pick<
  GetUserCredentialsResponse,
  "has_password"
>;
