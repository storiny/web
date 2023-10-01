import { IncomingFriendRequest } from "@storiny/shared";
import { clsx } from "clsx";
import React from "react";

import Form, { SubmitHandler, use_form, zod_resolver } from "~/components/form";
import FormRadio from "~/components/form-radio";
import FormRadioGroup from "~/components/form-radio-group";
import Spacer from "~/components/spacer";
import { use_toast } from "~/components/toast";
import Typography from "~/components/typography";
import { use_incoming_friend_requests_mutation } from "~/redux/features";
import css from "~/theme/main.module.scss";

import styles from "../site-safety.module.scss";
import { FriendRequestsProps } from "./friend-requests.props";
import {
  FRIEND_REQUESTS_SCHEMA,
  FriendRequestsSchema
} from "./friend-requests.schema";

const FriendRequests = ({
  on_submit,
  incoming_friend_requests
}: FriendRequestsProps): React.ReactElement => {
  const toast = use_toast();
  const prev_values_ref = React.useRef<FriendRequestsSchema>();
  const form = use_form<FriendRequestsSchema>({
    resolver: zod_resolver(FRIEND_REQUESTS_SCHEMA),
    defaultValues: {
      friend_requests: `${incoming_friend_requests}` as `${1 | 2 | 3 | 4}`
    }
  });
  const [mutate_incoming_friend_requests, { isLoading: is_loading }] =
    use_incoming_friend_requests_mutation();

  const handle_submit: SubmitHandler<FriendRequestsSchema> = (values) => {
    if (on_submit) {
      on_submit(values);
    } else {
      mutate_incoming_friend_requests(values)
        .unwrap()
        .then(() => (prev_values_ref.current = values))
        .catch((e) => {
          form.reset(prev_values_ref.current);
          toast(
            e?.data?.error || "Could not change your friend request settings",
            "error"
          );
        });
    }
  };

  return (
    <React.Fragment>
      <Typography as={"h3"} level={"h6"}>
        Friend requests
      </Typography>
      <Spacer orientation={"vertical"} size={0.5} />
      <Typography className={css["t-minor"]} level={"body2"}>
        Choose who can send you a friend request.
      </Typography>
      <Spacer orientation={"vertical"} />
      <Form<FriendRequestsSchema>
        className={clsx(css["flex-col"], styles.x, styles.form)}
        disabled={is_loading}
        on_submit={handle_submit}
        provider_props={form}
      >
        <FormRadioGroup
          auto_size
          className={clsx(styles.x, styles["radio-group"])}
          name={"friend_requests"}
          onValueChange={(): void => {
            form.handleSubmit(handle_submit)();
          }}
        >
          <FormRadio
            aria-label={"Everyone"}
            label={"Everyone"}
            value={`${IncomingFriendRequest.EVERYONE}`}
          />
          <FormRadio
            aria-label={"Users I follow"}
            label={"Users I follow"}
            value={`${IncomingFriendRequest.FOLLOWING}`}
          />
          <FormRadio
            aria-label={"Friends of friends"}
            label={"Friends of friends"}
            value={`${IncomingFriendRequest.FOF}`}
          />
          <FormRadio
            aria-label={"No one"}
            label={"No one"}
            value={`${IncomingFriendRequest.NONE}`}
          />
        </FormRadioGroup>
      </Form>
    </React.Fragment>
  );
};

export default FriendRequests;
