import { MenubarRadioGroupProps as MenubarRadioGroupPrimitiveProps } from "@radix-ui/react-menubar";

import { PolymorphicProps } from "~/types/index";

type MenubarRadioGroupPrimitive = MenubarRadioGroupPrimitiveProps &
  PolymorphicProps<"div">;

export type MenubarRadioGroupProps = MenubarRadioGroupPrimitive;
