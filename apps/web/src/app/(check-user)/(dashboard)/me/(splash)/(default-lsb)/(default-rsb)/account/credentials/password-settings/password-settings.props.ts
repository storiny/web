import { GetCredentialsResponse } from "~/common/grpc";

export type PasswordSettingsProps = Pick<
  GetCredentialsResponse,
  "has_password"
>;
