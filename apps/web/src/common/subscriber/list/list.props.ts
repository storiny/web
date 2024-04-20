import { Subscriber } from "@storiny/types";
import { VirtuosoProps } from "react-virtuoso";

import { SubscriberProps } from "~/entities/subscriber";

export interface VirtualizedSubscriberListProps
  extends VirtuosoProps<Subscriber, any> {
  /**
   * Flag indicating whether there are more subcribers to render.
   */
  has_more: boolean;
  /**
   * A callback function to fetch more subscribers.
   */
  load_more: () => void;
  /**
   * Props passed down to individual subscriber entities.
   */
  subscriber_props?: Partial<SubscriberProps>;
  /**
   * Array of subscribers to render.
   */
  subscribers: Subscriber[];
}
