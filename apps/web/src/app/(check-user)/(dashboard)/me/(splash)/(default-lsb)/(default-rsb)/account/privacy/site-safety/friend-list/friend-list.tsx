import { RelationVisibility } from "@storiny/shared";
import { clsx } from "clsx";
import React from "react";

import Form, { SubmitHandler, use_form, zod_resolver } from "~/components/form";
import FormRadio from "~/components/form-radio";
import FormRadioGroup from "~/components/form-radio-group";
import Spacer from "~/components/spacer";
import { use_toast } from "~/components/toast";
import Typography from "~/components/typography";
import {
  select_is_private_account,
  use_friend_list_mutation
} from "~/redux/features";
import { use_app_selector } from "~/redux/hooks";

import styles from "../site-safety.module.scss";
import { FriendListProps } from "./friend-list.props";
import { FriendListSchema, FRIEND_LIST_SCHEMA } from "./friend-list.schema";

const FriendList = ({
  on_submit,
  friend_list_visibility
}: FriendListProps): React.ReactElement => {
  const toast = use_toast();
  const is_private = use_app_selector(select_is_private_account);
  const prev_values_ref = React.useRef<FriendListSchema>();
  const form = use_form<FriendListSchema>({
    resolver: zod_resolver(FRIEND_LIST_SCHEMA),
    defaultValues: {
      friend_list: `${friend_list_visibility}` as `${1 | 2 | 3}`
    }
  });
  const [mutate_friend_list, { isLoading: is_loading }] =
    use_friend_list_mutation();

  const handle_submit: SubmitHandler<FriendListSchema> = (values) => {
    if (on_submit) {
      on_submit(values);
    } else {
      mutate_friend_list(values)
        .unwrap()
        .then(() => (prev_values_ref.current = values))
        .catch((e) => {
          form.reset(prev_values_ref.current);
          toast(
            e?.data?.error || "Could not change your friend list settings",
            "error"
          );
        });
    }
  };

  return (
    <React.Fragment>
      <Typography as={"h3"} level={"h6"}>
        Friend list
      </Typography>
      <Spacer orientation={"vertical"} size={0.5} />
      <Typography className={"t-minor"} level={"body2"}>
        Choose who can see your list of friends.
      </Typography>
      <Spacer orientation={"vertical"} />
      <Form<FriendListSchema>
        className={clsx("flex-col", styles.x, styles.form)}
        disabled={is_loading}
        on_submit={handle_submit}
        provider_props={form}
      >
        <FormRadioGroup
          auto_size
          className={clsx(styles.x, styles["radio-group"])}
          name={"friend_list"}
          onValueChange={(): void => {
            form.handleSubmit(handle_submit)();
          }}
        >
          <FormRadio
            aria-label={"Everyone"}
            disabled={is_private}
            label={"Everyone"}
            value={`${RelationVisibility.EVERYONE}`}
          />
          <FormRadio
            aria-label={"Friends"}
            label={"Friends"}
            value={`${RelationVisibility.FRIENDS}`}
          />
          <FormRadio
            aria-label={"No one"}
            label={"No one"}
            value={`${RelationVisibility.NONE}`}
          />
        </FormRadioGroup>
      </Form>
    </React.Fragment>
  );
};

export default FriendList;
