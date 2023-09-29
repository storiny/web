import { SeparatorProps } from "@radix-ui/react-separator";

import { PolymorphicProps } from "~/types/index";

type DividerPrimitive = SeparatorProps & PolymorphicProps<"div">;

export interface DividerProps extends DividerPrimitive {}
