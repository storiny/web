import { IncomingFriendRequest } from "@storiny/shared";
import { clsx } from "clsx";
import React from "react";

import Form, { SubmitHandler, useForm, zodResolver } from "~/components/Form";
import FormRadio from "~/components/FormRadio";
import FormRadioGroup from "~/components/FormRadioGroup";
import Spacer from "~/components/Spacer";
import { useToast } from "~/components/Toast";
import Typography from "~/components/Typography";
import { use_incoming_friend_requests_mutation } from "~/redux/features";

import styles from "../site-safety.module.scss";
import { FriendRequestsProps } from "./friend-requests.props";
import {
  FriendRequestsSchema,
  friendRequestsSchema
} from "./friend-requests.schema";

const FriendRequests = ({
  onSubmit,
  incoming_friend_requests
}: FriendRequestsProps): React.ReactElement => {
  const toast = useToast();
  const prevValuesRef = React.useRef<FriendRequestsSchema>();
  const form = useForm<FriendRequestsSchema>({
    resolver: zodResolver(friendRequestsSchema),
    defaultValues: {
      "friend-requests": `${incoming_friend_requests}` as `${1 | 2 | 3 | 4}`
    }
  });
  const [mutateIncomingFriendRequests, { isLoading }] =
    use_incoming_friend_requests_mutation();

  const handleSubmit: SubmitHandler<FriendRequestsSchema> = (values) => {
    if (onSubmit) {
      onSubmit(values);
    } else {
      mutateIncomingFriendRequests(values)
        .unwrap()
        .then(() => (prevValuesRef.current = values))
        .catch((e) => {
          form.reset(prevValuesRef.current);
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
      <Typography className={"t-minor"} level={"body2"}>
        Choose who can send you a friend request.
      </Typography>
      <Spacer orientation={"vertical"} />
      <Form<FriendRequestsSchema>
        className={clsx("flex-col", styles.x, styles.form)}
        disabled={isLoading}
        onSubmit={handleSubmit}
        providerProps={form}
      >
        <FormRadioGroup
          autoSize
          className={clsx(styles.x, styles["radio-group"])}
          name={"friend-requests"}
          onValueChange={(): void => {
            form.handleSubmit(handleSubmit)();
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
