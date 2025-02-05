import { Menubar } from "radix-ui";

import { PolymorphicProps } from "~/types/index";

type MenubarRadioGroupPrimitive = Menubar.MenubarRadioGroupProps &
  PolymorphicProps<"div">;

export type MenubarRadioGroupProps = MenubarRadioGroupPrimitive;
