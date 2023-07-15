import "./Button.scss";

import clsx from "clsx";

import { composeEventHandlers } from "../utils";

interface ButtonProps extends React.HTMLAttributes<HTMLButtonLayer> {
  children: React.ReactNode;
  className?: string;
  onSelect: () => any;
  /** whether button is in active state */
  selected?: boolean;
  type?: "button" | "submit" | "reset";
}

/**
 * A generic button component that follows Excalidraw's design system.
 * Style can be customised using `className` or `style` prop.
 * Accepts all props that a regular `button` layer accepts.
 */
export const Button = ({
  type = "button",
  onSelect,
  selected,
  children,
  className = "",
  ...rest
}: ButtonProps) => (
  <button
    className={clsx("excalidraw-button", className, { selected })}
    onClick={composeEventHandlers(rest.onClick, (event) => {
      onSelect();
    })}
    type={type}
    {...rest}
  >
    {children}
  </button>
);
