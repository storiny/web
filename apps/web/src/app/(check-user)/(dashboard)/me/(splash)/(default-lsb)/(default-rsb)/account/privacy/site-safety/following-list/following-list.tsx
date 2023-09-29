import { RelationVisibility } from "@storiny/shared";
import { clsx } from "clsx";
import React from "react";

import Form, {
  SubmitHandler,
  use_form,
  zod_resolver
} from "../../../../../../../../../../../../../../packages/ui/src/components/form";
import FormRadio from "../../../../../../../../../../../../../../packages/ui/src/components/form-radio";
import FormRadioGroup from "../../../../../../../../../../../../../../packages/ui/src/components/form-radio-group";
import Spacer from "../../../../../../../../../../../../../../packages/ui/src/components/spacer";
import { use_toast } from "../../../../../../../../../../../../../../packages/ui/src/components/toast";
import Typography from "../../../../../../../../../../../../../../packages/ui/src/components/typography";
import {
  select_is_private_account,
  use_following_list_mutation
} from "~/redux/features";
import { use_app_selector } from "~/redux/hooks";

import styles from "../site-safety.module.scss";
import { FollowingListProps } from "./following-list.props";
import {
  FollowingListSchema,
  followingListSchema
} from "./following-list.schema";

const FollowingList = ({
  on_submit,
  following_list_visibility
}: FollowingListProps): React.ReactElement => {
  const toast = use_toast();
  const isPrivate = use_app_selector(select_is_private_account);
  const prevValuesRef = React.useRef<FollowingListSchema>();
  const form = use_form<FollowingListSchema>({
    resolver: zod_resolver(followingListSchema),
    defaultValues: {
      "following-list": `${following_list_visibility}` as `${1 | 2 | 3}`
    }
  });
  const [mutateFollowingList, { isLoading }] = use_following_list_mutation();

  const handleSubmit: SubmitHandler<FollowingListSchema> = (values) => {
    if (on_submit) {
      on_submit(values);
    } else {
      mutateFollowingList(values)
        .unwrap()
        .then(() => (prevValuesRef.current = values))
        .catch((e) => {
          form.reset(prevValuesRef.current);
          toast(
            e?.data?.error || "Could not change your following list settings",
            "error"
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
      <Typography className={"t-minor"} level={"body2"}>
        Choose who can view the list of users you follow.
      </Typography>
      <Spacer orientation={"vertical"} />
      <Form<FollowingListSchema>
        className={clsx("flex-col", styles.x, styles.form)}
        disabled={isLoading}
        on_submit={handleSubmit}
        provider_props={form}
      >
        <FormRadioGroup
          auto_size
          className={clsx(styles.x, styles["radio-group"])}
          name={"following-list"}
          onValueChange={(): void => {
            form.handleSubmit(handleSubmit)();
          }}
        >
          <FormRadio
            aria-label={"Everyone"}
            disabled={isPrivate}
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
