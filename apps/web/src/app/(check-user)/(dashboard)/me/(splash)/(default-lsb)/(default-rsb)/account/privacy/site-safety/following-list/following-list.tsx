import { RelationVisibility } from "@storiny/shared";
import { clsx } from "clsx";
import React from "react";

import Form, { SubmitHandler, useForm, zodResolver } from "~/components/Form";
import FormRadio from "~/components/FormRadio";
import FormRadioGroup from "~/components/FormRadioGroup";
import Spacer from "~/components/Spacer";
import { useToast } from "~/components/Toast";
import Typography from "~/components/Typography";
import {
  selectIsPrivateAccount,
  useFollowingListMutation
} from "~/redux/features";
import { useAppSelector } from "~/redux/hooks";

import styles from "../site-safety.module.scss";
import { FollowingListProps } from "./following-list.props";
import {
  FollowingListSchema,
  followingListSchema
} from "./following-list.schema";

const FollowingList = ({
  onSubmit,
  following_list_visibility
}: FollowingListProps): React.ReactElement => {
  const toast = useToast();
  const isPrivate = useAppSelector(selectIsPrivateAccount);
  const prevValuesRef = React.useRef<FollowingListSchema>();
  const form = useForm<FollowingListSchema>({
    resolver: zodResolver(followingListSchema),
    defaultValues: {
      "following-list": `${following_list_visibility}` as `${1 | 2 | 3}`
    }
  });
  const [followingList, { isLoading }] = useFollowingListMutation();

  const handleSubmit: SubmitHandler<FollowingListSchema> = (values) => {
    if (onSubmit) {
      onSubmit(values);
    } else {
      followingList(values)
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
        onSubmit={handleSubmit}
        providerProps={form}
      >
        <FormRadioGroup
          autoSize
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
