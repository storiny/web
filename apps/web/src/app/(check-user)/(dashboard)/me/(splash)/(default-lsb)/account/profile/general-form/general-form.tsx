"use client";

import { userProps } from "@storiny/shared";
import { clsx } from "clsx";
import React from "react";

import Button from "../../../../../../../../../../../../packages/ui/src/components/button";
import Form, {
  SubmitHandler,
  use_form,
  use_form_context,
  zod_resolver
} from "../../../../../../../../../../../../packages/ui/src/components/form";
import FormInput from "../../../../../../../../../../../../packages/ui/src/components/form-input";
import FormTextarea from "../../../../../../../../../../../../packages/ui/src/components/form-textarea";
import Grow from "../../../../../../../../../../../../packages/ui/src/components/grow";
import Link from "../../../../../../../../../../../../packages/ui/src/components/link";
import Spacer from "../../../../../../../../../../../../packages/ui/src/components/spacer";
import { use_toast } from "../../../../../../../../../../../../packages/ui/src/components/toast";
import {
  mutate_user,
  select_user,
  use_profile_settings_mutation
} from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";

import styles from "./general-form.module.scss";
import { GeneralFormProps } from "./general-form.props";
import {
  AccountGeneralSchema,
  accountGeneralSchema
} from "./general-form.schema";

// Save button

const SaveButton = ({
  isLoading
}: {
  isLoading: boolean;
}): React.ReactElement => {
  const { formState } = use_form_context();
  return (
    <div className={clsx("flex")}>
      <Grow />
      <Button
        auto_size
        check_auth
        disabled={!formState.isDirty}
        loading={isLoading}
        type={"submit"}
      >
        Save Profile
      </Button>
    </div>
  );
};

const AccountGeneralForm = ({
  on_submit
}: GeneralFormProps): React.ReactElement => {
  const dispatch = use_app_dispatch();
  const toast = use_toast();
  const user = use_app_selector(select_user)!;
  const form = use_form<AccountGeneralSchema>({
    resolver: zod_resolver(accountGeneralSchema),
    defaultValues: {
      name: user.name,
      bio: user.bio,
      location: user.location
    }
  });
  const [mutateProfileSettings, { isLoading }] =
    use_profile_settings_mutation();

  const handleSubmit: SubmitHandler<AccountGeneralSchema> = (values) => {
    if (on_submit) {
      on_submit(values);
    } else {
      mutateProfileSettings(values)
        .unwrap()
        .then(() => {
          dispatch(mutate_user(values));
          form.reset(values);
          toast("Profile updated successfully", "success");
        })
        .catch((e) => {
          toast(
            e?.data?.error || "Could not update your profile settings",
            "error"
          );
        });
    }
  };

  return (
    <Form<AccountGeneralSchema>
      className={clsx("flex-col")}
      disabled={isLoading}
      on_submit={handleSubmit}
      provider_props={form}
    >
      <div className={clsx("flex-center", styles.x, styles["input-row"])}>
        <FormInput
          autoComplete={"name"}
          auto_size
          data-testid={"name-input"}
          form_slot_props={{
            form_item: {
              className: "f-grow"
            }
          }}
          helper_text={
            "Provide a name that you are commonly known by, such as your full name or nickname, to help others find you easily."
          }
          label={"Name"}
          maxLength={userProps.name.maxLength}
          minLength={userProps.name.minLength}
          name={"name"}
          placeholder={"Your name"}
          required
        />
        <FormInput
          autoComplete={"country-name"}
          auto_size
          data-testid={"location-input"}
          form_slot_props={{
            form_item: {
              className: "f-grow"
            }
          }}
          helper_text={
            "Your location helps us improve your home feed and is also displayed on your public profile."
          }
          label={"Location"}
          maxLength={userProps.location.maxLength}
          name={"location"}
          placeholder={"Your location"}
        />
      </div>
      <Spacer orientation={"vertical"} size={3} />
      <FormTextarea
        data-testid={"bio-textarea"}
        helper_text={
          <React.Fragment>
            You can format your bio using selected markdown features such as **
            <b>bold</b>** and *<em>italics</em>*, and you can also mention
            <span className={"t-medium"}>@someone</span>.{" "}
            <Link href={"/guides/formatting-bio"} underline={"always"}>
              Learn more about formatting your bio
            </Link>
            .
          </React.Fragment>
        }
        label={"Bio"}
        maxLength={userProps.bio.maxLength}
        name={"bio"}
        placeholder={"Your bio"}
      />
      <Spacer orientation={"vertical"} size={3} />
      <SaveButton isLoading={isLoading} />
    </Form>
  );
};

export default AccountGeneralForm;
