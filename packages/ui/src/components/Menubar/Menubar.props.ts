import { MenubarProps as MenubarPrimitiveProps } from "@radix-ui/react-menubar";

import { PolymorphicProps } from "~/types/index";

type MenubarPrimitive = MenubarPrimitiveProps & PolymorphicProps<"div">;

export interface MenubarProps extends MenubarPrimitive {}
