import { Menubar } from "radix-ui";

import { PolymorphicProps } from "~/types/index";

type MenubarPrimitive = Menubar.MenubarProps & PolymorphicProps<"div">;

export type MenubarProps = MenubarPrimitive;
