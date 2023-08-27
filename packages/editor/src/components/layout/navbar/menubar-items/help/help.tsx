import NextLink from "next/link";
import React from "react";

import MenubarItem from "~/components/MenubarItem";
import MenubarSub from "~/components/MenubarSub";
import Separator from "~/components/Separator";

const HelpItem = (): React.ReactElement => (
  <MenubarSub trigger={"Help"}>
    <MenubarItem as={NextLink} href={"/help"} target={"_blank"}>
      Help center
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
