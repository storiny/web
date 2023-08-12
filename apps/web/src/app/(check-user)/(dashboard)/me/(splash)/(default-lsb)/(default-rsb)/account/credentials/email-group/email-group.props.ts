import { GetCredentialsResponse } from "~/common/grpc";

export type EmailGroupProps = Pick<GetCredentialsResponse, "has_password">;
