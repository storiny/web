import "./SidebarTrigger.scss";

import clsx from "clsx";

import { useUIAppState } from "../../context/ui-editorState";
import { useExcalidrawSetAppState } from "../App";
import { SidebarTriggerProps } from "./common";

export const SidebarTrigger = ({
  name,
  tab,
  icon,
  title,
  children,
  onToggle,
  className,
  style
}: SidebarTriggerProps) => {
  const setAppState = useExcalidrawSetAppState();
  const editorState = useUIAppState();

  return (
    <label title={title}>
      <input
        aria-keyshortcuts="0"
        aria-label={title}
        checked={editorState.openSidebar?.name === name}
        className="ToolIcon_type_checkbox"
        onChange={(event) => {
          document
            .querySelector(".layer-ui__wrapper")
            ?.classList.remove("animate");
          const isOpen = event.target.checked;
          setAppState({ openSidebar: isOpen ? { name, tab } : null });
          onToggle?.(isOpen);
        }}
        type="checkbox"
      />
      <div className={clsx("sidebar-trigger", className)} style={style}>
        {icon && <div>{icon}</div>}
        {children && <div className="sidebar-trigger__label">{children}</div>}
      </div>
    </label>
  );
};
SidebarTrigger.displayName = "SidebarTrigger";
