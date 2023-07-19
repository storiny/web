import "./DialogActionButton.scss";

import clsx from "clsx";
import { ReactNode } from "react";

import Spinner from "./Spinner";

interface DialogActionButtonProps {
  actionType?: "primary" | "danger";
  children?: ReactNode;
  isLoading?: boolean;
  label: string;
}

const DialogActionButton = ({
  label,
  onClick,
  className,
  children,
  actionType,
  type = "button",
  isLoading,
  ...rest
}: DialogActionButtonProps & React.ButtonHTMLAttributes<HTMLButtonLayer>) => {
  const cs = actionType ? `Dialog__action-button--${actionType}` : "";

  return (
    <button
      aria-label={label}
      className={clsx("Dialog__action-button", cs, className)}
      onClick={onClick}
      type={type}
      {...rest}
    >
      {children && (
        <div style={isLoading ? { visibility: "hidden" } : {}}>{children}</div>
      )}
      <div style={isLoading ? { visibility: "hidden" } : {}}>{label}</div>
      {isLoading && (
        <div style={{ position: "absolute", inset: 0 }}>
          <Spinner />
        </div>
      )}
    </button>
  );
};

export default DialogActionButton;
