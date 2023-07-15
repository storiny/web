import clsx from "clsx";

import { useDevice } from "../App";

const MenuTrigger = ({
  className = "",
  children,
  onToggle,
  title,
  ...rest
}: {
  children: React.ReactNode;
  className?: string;
  onToggle: () => void;
  title?: string;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonLayer>, "onSelect">) => {
  const device = useDevice();
  const classNames = clsx(
    `dropdown-menu-button ${className}`,
    "zen-mode-transition",
    {
      "dropdown-menu-button--mobile": device.isMobile
    }
  ).trim();
  return (
    <button
      className={classNames}
      data-prevent-outside-click
      data-testid="dropdown-menu-button"
      onClick={onToggle}
      title={title}
      type="button"
      {...rest}
    >
      {children}
    </button>
  );
};

export default MenuTrigger;
MenuTrigger.displayName = "DropdownMenuTrigger";
