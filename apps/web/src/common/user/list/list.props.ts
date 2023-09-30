import { User } from "@storiny/types";
import { VirtuosoProps } from "react-virtuoso";

import { UserProps } from "~/entities/user";

export interface VirtualizedUserListProps extends VirtuosoProps<User, any> {
  /**
   * Flag indicating whether there are more users to render.
   */
  has_more: boolean;
  /**
   * A callback function to fetch more users.
   */
  load_more: () => void;
  /**
   * Props passed down to individual user entities.
   */
  user_props?: Partial<UserProps>;
  /**
   * Array of users to render.
   */
  users: User[];
}
