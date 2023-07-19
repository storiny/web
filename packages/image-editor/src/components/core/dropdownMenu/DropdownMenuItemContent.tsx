import { useDevice } from "../App";

const MenuItemContent = ({
  icon,
  shortcut,
  children
}: {
  children: React.ReactNode;
  icon?: JSX.Layer;
  shortcut?: string;
}) => {
  const device = useDevice();
  return (
    <>
      <div className="dropdown-menu-item__icon">{icon}</div>
      <div className="dropdown-menu-item__text">{children}</div>
      {shortcut && !device.isMobile && (
        <div className="dropdown-menu-item__shortcut">{shortcut}</div>
      )}
    </>
  );
};
export default MenuItemContent;
