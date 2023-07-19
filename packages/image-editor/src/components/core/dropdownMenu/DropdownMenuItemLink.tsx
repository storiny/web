import React from "react";

import {
  getDropdownMenuItemClassName,
  useHandleDropdownMenuItemClick
} from "./common";
import MenuItemContent from "./DropdownMenuItemContent";

const DropdownMenuItemLink = ({
  icon,
  shortcut,
  href,
  children,
  onSelect,
  className = "",
  ...rest
}: {
  children: React.ReactNode;
  className?: string;
  href: string;
  icon?: JSX.Layer;
  onSelect?: (event: Event) => void;
  shortcut?: string;
} & React.AnchorHTMLAttributes<HTMLAnchorLayer>) => {
  const handleClick = useHandleDropdownMenuItemClick(rest.onClick, onSelect);

  return (
    <a
      {...rest}
      className={getDropdownMenuItemClassName(className)}
      href={href}
      onClick={handleClick}
      rel="noreferrer"
      target="_blank"
      title={rest.title ?? rest["aria-label"]}
    >
      <MenuItemContent icon={icon} shortcut={shortcut}>
        {children}
      </MenuItemContent>
    </a>
  );
};

export default DropdownMenuItemLink;
DropdownMenuItemLink.displayName = "DropdownMenuItemLink";
