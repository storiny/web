import { Subscriber } from "@storiny/types";
import React from "react";

export interface SubscriberProps extends React.ComponentPropsWithoutRef<"div"> {
  /**
   * The subscriber object
   */
  subscriber: Subscriber;
}
