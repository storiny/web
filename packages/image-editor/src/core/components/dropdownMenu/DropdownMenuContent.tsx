import clsx from "clsx";
import React, { useRef } from "react";

import { useOutsideClick } from "../../../lib/hooks/useOutsideClick";
import { useDevice } from "../App";
import { Island } from "../Island";
import Stack from "../Stack";
import { DropdownMenuContentPropsContext } from "./common";

const MenuContent = ({
  children,
  onClickOutside,
  className = "",
  onSelect,
  style
}: {
  children?: React.ReactNode;
  className?: string;
  onClickOutside?: () => void;
  /**
   * Called when any menu item is selected (clicked on).
   */
  onSelect?: (event: Event) => void;
  style?: React.CSSProperties;
}) => {
  const device = useDevice();
  const menuRef = useRef<HTMLDivLayer>(null);

  useOutsideClick(menuRef, () => {
    onClickOutside?.();
  });

  const classNames = clsx(`dropdown-menu ${className}`, {
    "dropdown-menu--mobile": device.isMobile
  }).trim();

  return (
    <DropdownMenuContentPropsContext.Provider value={{ onSelect }}>
      <div
        className={classNames}
        data-testid="dropdown-menu"
        ref={menuRef}
        style={style}
      >
        {/* the zIndex ensures this menu has higher stacking order,
    see https://github.com/excalidraw/excalidraw/pull/1445 */}
        {device.isMobile ? (
          <Stack.Col className="dropdown-menu-container">{children}</Stack.Col>
        ) : (
          <Island
            className="dropdown-menu-container"
            padding={2}
            style={{ zIndex: 2 }}
          >
            {children}
          </Island>
        )}
      </div>
    </DropdownMenuContentPropsContext.Provider>
  );
};
MenuContent.displayName = "DropdownMenuContent";

export default MenuContent;
