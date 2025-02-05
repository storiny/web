import { Separator } from "radix-ui";

import { PolymorphicProps } from "~/types/index";

type DividerPrimitive = Separator.SeparatorProps & PolymorphicProps<"div">;

export type DividerProps = DividerPrimitive;
