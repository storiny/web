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
  use_following_list_mutation
} from "~/redux/features";
import { use_app_selector } from "~/redux/hooks";
import css from "~/theme/main.module.scss";
import { handle_api_error } from "~/utils/handle-api-error";

import styles from "../site-safety.module.scss";
import { FollowingListProps } from "./following-list.props";
import {
  FOLLOWING_LIST_SCHEMA,
  FollowingListSchema
} from "./following-list.schema";

const FollowingList = ({
  on_submit,
  following_list_visibility
}: FollowingListProps): React.ReactElement => {
  const toast = use_toast();
  const is_private = use_app_selector(select_is_private_account);
  const prev_values_ref = React.useRef<FollowingListSchema>();
  const form = use_form<FollowingListSchema>({
    resolver: zod_resolver(FOLLOWING_LIST_SCHEMA),
    defaultValues: {
      following_list: `${following_list_visibility}` as `${1 | 2 | 3}`
    }
  });
  const [mutate_following_list, { isLoading: is_loading }] =
    use_following_list_mutation();

  const handle_submit: SubmitHandler<FollowingListSchema> = (values) => {
    if (on_submit) {
      on_submit(values);
    } else {
      mutate_following_list(values)
        .unwrap()
        .then(() => (prev_values_ref.current = values))
        .catch((error) => {
          form.reset(prev_values_ref.current);

          handle_api_error(
            error,
            toast,
            form,
            "Could not change your following list settings"
          );
        });
    }
  };

  return (
    <React.Fragment>
      <Typography as={"h3"} level={"h6"}>
        Following list
      </Typography>
      <Spacer orientation={"vertical"} size={0.5} />
      <Typography color={"minor"} level={"body2"}>
        Choose who can view the list of users you follow.
      </Typography>
      <Spacer orientation={"vertical"} />
      <Form<FollowingListSchema>
        className={clsx(css["flex-col"], styles.x, styles.form)}
        disabled={is_loading}
        on_submit={handle_submit}
        provider_props={form}
      >
        <FormRadioGroup
          auto_size
          className={clsx(styles.x, styles["radio-group"])}
          name={"following_list"}
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

export default FollowingList;
