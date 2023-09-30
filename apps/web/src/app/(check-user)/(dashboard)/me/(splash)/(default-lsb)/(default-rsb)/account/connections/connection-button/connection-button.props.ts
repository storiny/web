import { ConnectionsProps } from "../connections.props";

export interface ConnectionButtonProps {
  connection?: ConnectionsProps["connections"][number];
  on_remove: () => void;
  provider: string;
}
