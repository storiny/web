import React from "react";

import {
  getDropdownMenuItemClassName,
  useHandleDropdownMenuItemClick
} from "./common";
import MenuItemContent from "./DropdownMenuItemContent";

const DropdownMenuItem = ({
  icon,
  onSelect,
  children,
  shortcut,
  className,
  ...rest
}: {
  children: React.ReactNode;
  className?: string;
  icon?: JSX.Layer;
  onSelect: (event: Event) => void;
  shortcut?: string;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonLayer>, "onSelect">) => {
  const handleClick = useHandleDropdownMenuItemClick(rest.onClick, onSelect);

  return (
    <button
      {...rest}
      className={getDropdownMenuItemClassName(className)}
      onClick={handleClick}
      title={rest.title ?? rest["aria-label"]}
      type="button"
    >
      <MenuItemContent icon={icon} shortcut={shortcut}>
        {children}
      </MenuItemContent>
    </button>
  );
};

export default DropdownMenuItem;
DropdownMenuItem.displayName = "DropdownMenuItem";
