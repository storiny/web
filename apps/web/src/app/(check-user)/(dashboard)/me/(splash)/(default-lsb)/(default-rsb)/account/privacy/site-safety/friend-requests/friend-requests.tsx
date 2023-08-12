import { RelationVisibility } from "@storiny/shared";
import { clsx } from "clsx";
import React from "react";

import { GetPrivacySettingsResponse } from "~/common/grpc";
import Form, { SubmitHandler, useForm, zodResolver } from "~/components/Form";
import FormRadio from "~/components/FormRadio";
import FormRadioGroup from "~/components/FormRadioGroup";
import Spacer from "~/components/Spacer";
import { useToast } from "~/components/Toast";
import Typography from "~/components/Typography";
import { useSensitiveContentMutation } from "~/redux/features";

import styles from "../site-safety.module.scss";
import { FriendRequestsSchema, friendRequestsSchema } from "./schema";

type Props = {
  onSubmit?: SubmitHandler<FriendRequestsSchema>;
} & Pick<GetPrivacySettingsResponse, "friends_list_visibility">;

const FriendRequests = ({
  onSubmit,
  friends_list_visibility
}: Props): React.ReactElement => {
  const toast = useToast();
  const form = useForm<FriendRequestsSchema>({
    resolver: zodResolver(friendRequestsSchema),
    defaultValues: {
      "friend-requests": String(friends_list_visibility) as any
    }
  });
  const [sensitiveContent, { isLoading }] = useSensitiveContentMutation();

  const handleSubmit: SubmitHandler<FriendRequestsSchema> = (values) => {
    if (onSubmit) {
      onSubmit(values);
    } else {
      sensitiveContent(values)
        .unwrap()
        .then(() => toast("Friend request settings updated", "success"))
        .catch((e) => {
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
      <Spacer orientation={"vertical"} size={0.5} />
      <Form<FriendRequestsSchema>
        className={clsx("flex-col", styles.form)}
        disabled={isLoading}
        onSubmit={handleSubmit}
        providerProps={form}
      >
        <FormRadioGroup
          helperText={
            <React.Fragment>
              Allow images and other media containing suggestive nudity,
              violence, or sensitive content to be displayed in stories without
              a warning. This setting only affects the accounts on this browser.
            </React.Fragment>
          }
          label={"Friend requests"}
          name={"friend-requests"}
          // onCheckedChange={(): void => {
          //   form.handleSubmit(handleSubmit)();
          // }}
        >
          <FormRadio
            aria-label={"Everyone"}
            label={"Everyone"}
            value={`${RelationVisibility.EVERYONE}`}
          />
        </FormRadioGroup>
      </Form>
    </React.Fragment>
  );
};

export default FriendRequests;
