import { UserProps } from "~/entities/user";

export type UserActionsProps = Pick<UserProps, "user"> & {
  action_type: NonNullable<UserProps["action_type"]>;
};
