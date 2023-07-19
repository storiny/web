import { actionLoadScene, actionShortcuts } from "../../../core/actions";
import { getShortcutFromShortcutName } from "../../../core/actions/shortcuts";
import { useTunnels } from "../../../core/context/tunnels";
import { useUIAppState } from "../../context/ui-editorState";
import { t, useI18n } from "../../i18n";
import { useDevice, useExcalidrawActionManager } from "../App";
import { ExcalLogo, HelpIcon, LoadIcon, usersIcon } from "../icons";

const WelcomeScreenMenuItemContent = ({
  icon,
  shortcut,
  children
}: {
  children: React.ReactNode;
  icon?: JSX.Layer;
  shortcut?: string | null;
}) => {
  const device = useDevice();
  return (
    <>
      <div className="welcome-screen-menu-item__icon">{icon}</div>
      <div className="welcome-screen-menu-item__text">{children}</div>
      {shortcut && !device.isMobile && (
        <div className="welcome-screen-menu-item__shortcut">{shortcut}</div>
      )}
    </>
  );
};
WelcomeScreenMenuItemContent.displayName = "WelcomeScreenMenuItemContent";

const WelcomeScreenMenuItem = ({
  onSelect,
  children,
  icon,
  shortcut,
  className = "",
  ...props
}: {
  children: React.ReactNode;
  icon?: JSX.Layer;
  onSelect: () => void;
  shortcut?: string | null;
} & React.ButtonHTMLAttributes<HTMLButtonLayer>) => (
  <button
    {...props}
    className={`welcome-screen-menu-item ${className}`}
    onClick={onSelect}
    type="button"
  >
    <WelcomeScreenMenuItemContent icon={icon} shortcut={shortcut}>
      {children}
    </WelcomeScreenMenuItemContent>
  </button>
);
WelcomeScreenMenuItem.displayName = "WelcomeScreenMenuItem";

const WelcomeScreenMenuItemLink = ({
  children,
  href,
  icon,
  shortcut,
  className = "",
  ...props
}: {
  children: React.ReactNode;
  href: string;
  icon?: JSX.Layer;
  shortcut?: string | null;
} & React.AnchorHTMLAttributes<HTMLAnchorLayer>) => (
  <a
    {...props}
    className={`welcome-screen-menu-item ${className}`}
    href={href}
    rel="noreferrer"
    target="_blank"
  >
    <WelcomeScreenMenuItemContent icon={icon} shortcut={shortcut}>
      {children}
    </WelcomeScreenMenuItemContent>
  </a>
);
WelcomeScreenMenuItemLink.displayName = "WelcomeScreenMenuItemLink";

const Center = ({ children }: { children?: React.ReactNode }) => {
  const { WelcomeScreenCenterTunnel } = useTunnels();
  return (
    <WelcomeScreenCenterTunnel.In>
      <div className="welcome-screen-center">
        {children || (
          <>
            <Logo />
            <Heading>{t("welcomeScreen.defaults.center_heading")}</Heading>
            <Menu>
              <MenuItemLoadScene />
              <MenuItemHelp />
            </Menu>
          </>
        )}
      </div>
    </WelcomeScreenCenterTunnel.In>
  );
};
Center.displayName = "Center";

const Logo = ({ children }: { children?: React.ReactNode }) => (
  <div className="welcome-screen-center__logo virgil welcome-screen-decor">
    {children || <>{ExcalLogo} Excalidraw</>}
  </div>
);
Logo.displayName = "Logo";

const Heading = ({ children }: { children: React.ReactNode }) => (
  <div className="welcome-screen-center__heading welcome-screen-decor virgil">
    {children}
  </div>
);
Heading.displayName = "Heading";

const Menu = ({ children }: { children?: React.ReactNode }) => (
  <div className="welcome-screen-menu">{children}</div>
);
Menu.displayName = "Menu";

const MenuItemHelp = () => {
  const actionManager = useExcalidrawActionManager();

  return (
    <WelcomeScreenMenuItem
      icon={HelpIcon}
      onSelect={() => actionManager.executeAction(actionShortcuts)}
      shortcut="?"
    >
      {t("helpDialog.title")}
    </WelcomeScreenMenuItem>
  );
};
MenuItemHelp.displayName = "MenuItemHelp";

const MenuItemLoadScene = () => {
  const editorState = useUIAppState();
  const actionManager = useExcalidrawActionManager();

  if (editorState.viewModeEnabled) {
    return null;
  }

  return (
    <WelcomeScreenMenuItem
      icon={LoadIcon}
      onSelect={() => actionManager.executeAction(actionLoadScene)}
      shortcut={getShortcutFromShortcutName("loadScene")}
    >
      {t("buttons.load")}
    </WelcomeScreenMenuItem>
  );
};
MenuItemLoadScene.displayName = "MenuItemLoadScene";

const MenuItemLiveCollaborationTrigger = ({
  onSelect
}: {
  onSelect: () => any;
}) => {
  const { t } = useI18n();
  return (
    <WelcomeScreenMenuItem icon={usersIcon} onSelect={onSelect} shortcut={null}>
      {t("labels.liveCollaboration")}
    </WelcomeScreenMenuItem>
  );
};
MenuItemLiveCollaborationTrigger.displayName =
  "MenuItemLiveCollaborationTrigger";

// -----------------------------------------------------------------------------

Center.Logo = Logo;
Center.Heading = Heading;
Center.Menu = Menu;
Center.MenuItem = WelcomeScreenMenuItem;
Center.MenuItemLink = WelcomeScreenMenuItemLink;
Center.MenuItemHelp = MenuItemHelp;
Center.MenuItemLoadScene = MenuItemLoadScene;
Center.MenuItemLiveCollaborationTrigger = MenuItemLiveCollaborationTrigger;

export { Center };
