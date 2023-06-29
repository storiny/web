import { DropdownMenuSeparatorProps } from "@radix-ui/react-dropdown-menu";

import { PolymorphicProps } from "~/types/index";

type SeparatorPrimitive = DropdownMenuSeparatorProps & PolymorphicProps<"div">;

export interface SeparatorProps extends SeparatorPrimitive {}
