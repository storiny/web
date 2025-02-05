import { HoverCard } from "radix-ui";

import { PolymorphicProps } from "~/types/index";

type UserHoverCardPrimitive = HoverCard.HoverCardProps &
  PolymorphicProps<"div">;

export interface UserHoverCardProps extends UserHoverCardPrimitive {
  /**
   * The user identifier. Can either be the ID or the username of the user.
   */
  identifier: string;
  /**
   * The props passed to the individual component elements.
   */
  slot_props?: {
    arrow?: HoverCard.HoverCardArrowProps;
    content?: HoverCard.HoverCardContentProps;
    portal?: HoverCard.HoverCardPortalProps;
    trigger?: HoverCard.HoverCardTriggerProps;
  };
}
