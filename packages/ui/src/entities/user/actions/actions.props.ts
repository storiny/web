import { UserProps } from "src/entities/user";

export type UserActionsProps = Pick<UserProps, "user"> & {
  actionType: NonNullable<UserProps["actionType"]>;
};
