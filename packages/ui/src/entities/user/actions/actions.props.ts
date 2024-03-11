import { UserProps } from "~/entities/user";

export type UserActionsProps = Pick<UserProps, "user" | "custom_action"> & {
  action_type: NonNullable<UserProps["action_type"]>;
};
