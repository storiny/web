import { ConnectionsProps } from "../connections.props";

export interface ConnectionButtonProps {
  connection?: ConnectionsProps["connections"][number];
  onRemove: () => void;
  provider: string;
}
