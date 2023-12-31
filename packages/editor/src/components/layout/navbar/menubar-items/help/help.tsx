import NextLink from "next/link";
import React from "react";

import MenubarItem from "~/components/menubar-item";
import MenubarSub from "~/components/menubar-sub";
import Separator from "~/components/separator";

const HelpItem = (): React.ReactElement => (
  <MenubarSub trigger={"Help"}>
    <MenubarItem
      as={NextLink}
      href={"mailto:support@storiny.com"}
      target={"_blank"}
    >
      Help
    </MenubarItem>
    <MenubarItem as={NextLink} href={"/legal"} target={"_blank"}>
      Legal
    </MenubarItem>
    <Separator />
    <MenubarItem as={NextLink} href={"/me/account/profile"}>
      Account settings
    </MenubarItem>
    <MenubarItem as={NextLink} href={"/logout"}>
      Logout
    </MenubarItem>
  </MenubarSub>
);

export default HelpItem;
