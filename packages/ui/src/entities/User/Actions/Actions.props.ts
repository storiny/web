import { UserProps } from "~/entities/User";

export type UserActionsProps = Pick<UserProps, "user"> & {
  actionType: NonNullable<UserProps["actionType"]>;
};
