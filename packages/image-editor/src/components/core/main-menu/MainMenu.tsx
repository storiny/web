import React from "react";

import { useTunnels } from "../../../core/context/tunnels";
import { composeEventHandlers } from "../../../lib/utils/utils";
import { useUIAppState } from "../../context/ui-editorState";
import { t } from "../../i18n";
import { useDevice, useExcalidrawSetAppState } from "../App";
import DropdownMenu from "../dropdownMenu/DropdownMenu";
import { withInternalFallback } from "../hoc/withInternalFallback";
import { HamburgerMenuIcon } from "../icons";
import { UserList } from "../UserList";
import * as DefaultItems from "./DefaultItems";

const MainMenu = Object.assign(
  withInternalFallback(
    "MainMenu",
    ({
      children,
      onSelect
    }: {
      children?: React.ReactNode;
      /**
       * Called when any menu item is selected (clicked on).
       */
      onSelect?: (event: Event) => void;
    }) => {
      const { MainMenuTunnel } = useTunnels();
      const device = useDevice();
      const editorState = useUIAppState();
      const setAppState = useExcalidrawSetAppState();
      const onClickOutside = device.isMobile
        ? undefined
        : () => setAppState({ openMenu: null });

      return (
        <MainMenuTunnel.In>
          <DropdownMenu open={editorState.openMenu === "canvas"}>
            <DropdownMenu.Trigger
              data-testid="main-menu-trigger"
              onToggle={() => {
                setAppState({
                  openMenu: editorState.openMenu === "canvas" ? null : "canvas"
                });
              }}
            >
              {HamburgerMenuIcon}
            </DropdownMenu.Trigger>
            <DropdownMenu.Content
              onClickOutside={onClickOutside}
              onSelect={composeEventHandlers(onSelect, () => {
                setAppState({ openMenu: null });
              })}
            >
              {children}
              {device.isMobile && editorState.collaborators.size > 0 && (
                <fieldset className="UserList-Wrapper">
                  <legend>{t("labels.collaborators")}</legend>
                  <UserList
                    collaborators={editorState.collaborators}
                    mobile={true}
                  />
                </fieldset>
              )}
            </DropdownMenu.Content>
          </DropdownMenu>
        </MainMenuTunnel.In>
      );
    }
  ),
  {
    Trigger: DropdownMenu.Trigger,
    Item: DropdownMenu.Item,
    ItemLink: DropdownMenu.ItemLink,
    ItemCustom: DropdownMenu.ItemCustom,
    Group: DropdownMenu.Group,
    Separator: DropdownMenu.Separator,
    DefaultItems
  }
);

export default MainMenu;
