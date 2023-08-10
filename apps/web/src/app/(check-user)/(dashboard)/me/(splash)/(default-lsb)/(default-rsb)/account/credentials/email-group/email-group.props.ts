import { GetUserCredentialsResponse } from "~/common/grpc";

export type EmailGroupProps = Pick<GetUserCredentialsResponse, "has_password">;
