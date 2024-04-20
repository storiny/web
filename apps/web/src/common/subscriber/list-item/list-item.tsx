"use client";

import { Subscriber as TSubscriber } from "@storiny/types";
import React from "react";
import { ItemProps } from "react-virtuoso";

import Divider from "~/components/divider";
import Subscriber from "~/entities/subscriber";
import css from "~/theme/main.module.scss";

import { VirtualizedSubscriberListContext } from "../list/list-context";

const VirtualizedSubscriberItem = React.memo(
  ({ item, ...rest }: ItemProps<TSubscriber>) => {
    // Props from context
    const subscriber_props = React.useContext(VirtualizedSubscriberListContext);
    return (
      <div {...rest} className={css["flex-col"]}>
        <Subscriber {...subscriber_props} subscriber={item} />
        <Divider style={{ marginInline: "var(--grid-compensation)" }} />
      </div>
    );
  }
);

VirtualizedSubscriberItem.displayName = "VirtualizedSubscriberItem";

export default VirtualizedSubscriberItem;
