"use client";

import { userProps } from "@storiny/shared";
import { clsx } from "clsx";
import React from "react";

import Button from "~/components/Button";
import Form, {
  SubmitHandler,
  useForm,
  useFormContext,
  zodResolver
} from "~/components/Form";
import FormInput from "~/components/FormInput";
import FormTextarea from "~/components/FormTextarea";
import Grow from "~/components/Grow";
import Link from "~/components/Link";
import Spacer from "~/components/Spacer";
import { useToast } from "~/components/Toast";
import {
  mutateUser,
  selectUser,
  useProfileSettingsMutation
} from "~/redux/features";
import { useAppDispatch, useAppSelector } from "~/redux/hooks";

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
  const { formState } = useFormContext();
  return (
    <div className={clsx("flex")}>
      <Grow />
      <Button
        autoSize
        checkAuth
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
  onSubmit
}: GeneralFormProps): React.ReactElement => {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const user = useAppSelector(selectUser)!;
  const form = useForm<AccountGeneralSchema>({
    resolver: zodResolver(accountGeneralSchema),
    defaultValues: {
      name: user.name,
      bio: user.bio,
      location: user.location
    }
  });
  const [mutateProfileSettings, { isLoading }] = useProfileSettingsMutation();

  const handleSubmit: SubmitHandler<AccountGeneralSchema> = (values) => {
    if (onSubmit) {
      onSubmit(values);
    } else {
      mutateProfileSettings(values)
        .unwrap()
        .then(() => {
          dispatch(mutateUser(values));
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
      onSubmit={handleSubmit}
      providerProps={form}
    >
      <div className={clsx("flex-center", styles.x, styles["input-row"])}>
        <FormInput
          autoComplete={"name"}
          autoSize
          data-testid={"name-input"}
          formSlotProps={{
            formItem: {
              className: "f-grow"
            }
          }}
          helperText={
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
          autoSize
          data-testid={"location-input"}
          formSlotProps={{
            formItem: {
              className: "f-grow"
            }
          }}
          helperText={
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
        helperText={
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
