"use client";

import { use_blog_context } from "@storiny/web/src/common/context/blog";
import clsx from "clsx";
import React from "react";

import Button from "~/components/button";
import DateTime from "~/components/date-time";
import { use_toast } from "~/components/toast";
import Typography from "~/components/typography";
import {
  get_blog_subscribers_api,
  use_remove_blog_subscriber_mutation
} from "~/redux/features";
import { use_app_dispatch } from "~/redux/hooks";
import css from "~/theme/main.module.scss";
import { DateFormat } from "~/utils/format-date";
import { handle_api_error } from "~/utils/handle-api-error";

import styles from "./subscriber.module.scss";
import { SubscriberProps } from "./subscriber.props";

const Subscriber = (props: SubscriberProps): React.ReactElement => {
  const { className, subscriber, ...rest } = props;
  const toast = use_toast();
  const blog = use_blog_context();
  const dispatch = use_app_dispatch();
  const [remove_subscriber, { isLoading: is_loading }] =
    use_remove_blog_subscriber_mutation();

  /**
   * Removes the subscriber
   */
  const handle_remove = (): void => {
    remove_subscriber({ subscriber_id: subscriber.id, blog_id: blog.id })
      .unwrap()
      .then(() => {
        toast("Subscriber removed", "success");
        dispatch(get_blog_subscribers_api.util.resetApiState());
      })
      .catch((error) =>
        handle_api_error(error, toast, null, "Could not remove the subscriber")
      );
  };

  return (
    <div
      {...rest}
      className={clsx(css["flex-center"], styles.subscriber, className)}
    >
      <div className={clsx(css["flex-col"], styles.meta)}>
        <Typography className={css.ellipsis} level={"body2"} weight={"medium"}>
          {subscriber.email}
        </Typography>
        <Typography className={css.ellipsis} color={"minor"} level={"body3"}>
          <DateTime
            date={subscriber.created_at}
            format={DateFormat.RELATIVE_CAPITALIZED}
          />
        </Typography>
      </div>
      <Button
        auto_size
        check_auth
        loading={is_loading}
        onClick={handle_remove}
        variant={"ghost"}
      >
        Remove
      </Button>
    </div>
  );
};

export default React.memo(Subscriber);
