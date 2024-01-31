import {
  HoverCardArrowProps,
  HoverCardContentProps,
  HoverCardPortalProps,
  HoverCardProps,
  HoverCardTriggerProps
} from "@radix-ui/react-hover-card";

import { PolymorphicProps } from "~/types/index";

type UserHoverCardPrimitive = HoverCardProps & PolymorphicProps<"div">;

export interface UserHoverCardProps extends UserHoverCardPrimitive {
  /**
   * The user identifier. Can either be the ID or the username of the user.
   */
  identifier: string;
  /**
   * The props passed to the individual component elements.
   */
  slot_props?: {
    arrow?: HoverCardArrowProps;
    content?: HoverCardContentProps;
    portal?: HoverCardPortalProps;
    trigger?: HoverCardTriggerProps;
  };
}
