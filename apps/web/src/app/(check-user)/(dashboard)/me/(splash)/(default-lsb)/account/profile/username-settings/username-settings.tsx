import { USER_PROPS } from "@storiny/shared";
import { clsx } from "clsx";
import React from "react";

import Button from "../../../../../../../../../../../../packages/ui/src/components/button";
import Form, {
  SubmitHandler,
  use_form,
  zod_resolver
} from "../../../../../../../../../../../../packages/ui/src/components/form";
import FormInput from "../../../../../../../../../../../../packages/ui/src/components/form-input";
import FormPasswordInput from "../../../../../../../../../../../../packages/ui/src/components/form-password-input";
import {
  Description,
  ModalFooterButton,
  use_modal
} from "../../../../../../../../../../../../packages/ui/src/components/modal";
import Spacer from "../../../../../../../../../../../../packages/ui/src/components/spacer";
import { use_toast } from "../../../../../../../../../../../../packages/ui/src/components/toast";
import Typography from "../../../../../../../../../../../../packages/ui/src/components/typography";
import { use_media_query } from "../../../../../../../../../../../../packages/ui/src/hooks/use-media-query";
import AtIcon from "../../../../../../../../../../../../packages/ui/src/icons/at";
import PasswordIcon from "../../../../../../../../../../../../packages/ui/src/icons/password";
import { mutate_user, use_username_settings_mutation } from "~/redux/features";
import { use_app_dispatch } from "~/redux/hooks";
import { BREAKPOINTS } from "~/theme/breakpoints";

import { UsernameSettingsProps } from "./username-settings.props";
import {
  UsernameSettingsSchema,
  usernameSettingsSchema
} from "./username-settings.schema";

const UsernameSettingsModal = (): React.ReactElement => (
  <React.Fragment>
    <Description asChild>
      <Typography className={"t-minor"} level={"body2"}>
        Enter your new username along with your existing password.
      </Typography>
    </Description>
    <Spacer orientation={"vertical"} size={5} />
    <FormInput
      autoComplete={"username"}
      auto_size
      data-testid={"new-username-input"}
      decorator={<AtIcon />}
      form_slot_props={{
        form_item: {
          className: "f-grow"
        }
      }}
      label={"New username"}
      maxLength={USER_PROPS.username.max_length}
      minLength={USER_PROPS.username.min_length}
      name={"new-username"}
      placeholder={"Choose a new username"}
      required
    />
    <Spacer orientation={"vertical"} size={3} />
    <FormPasswordInput
      auto_size
      data-testid={"current-password-input"}
      decorator={<PasswordIcon />}
      form_slot_props={{
        form_item: {
          className: "f-grow"
        }
      }}
      label={"Current password"}
      name={"current-password"}
      placeholder={"Your current password"}
      required
    />
  </React.Fragment>
);

const UsernameSettings = ({
  on_submit
}: UsernameSettingsProps): React.ReactElement => {
  const dispatch = use_app_dispatch();
  const toast = use_toast();
  const is_smaller_than_mobile = use_media_query(BREAKPOINTS.down("mobile"));
  const form = use_form<UsernameSettingsSchema>({
    resolver: zod_resolver(usernameSettingsSchema),
    defaultValues: {
      "new-username": "",
      "current-password": ""
    }
  });
  const [mutateUsernameSettings, { isLoading }] =
    use_username_settings_mutation();

  const handleSubmit: SubmitHandler<UsernameSettingsSchema> = (values) => {
    if (on_submit) {
      on_submit(values);
    } else {
      mutateUsernameSettings(values)
        .unwrap()
        .then(() => {
          dispatch(
            mutate_user({
              username: values["new-username"]
            })
          );
          form.reset(); // Reset with empty values
          close_modal();
          toast("Username updated successfully", "success");
        })
        .catch((e) => {
          toast(e?.data?.error || "Could not update your username", "error");
        });
    }
  };

  const [element, , close_modal] = use_modal(
    ({ open_modal }) => (
      <Button
        check_auth
        className={"fit-w"}
        onClick={open_modal}
        variant={"hollow"}
      >
        Change username
      </Button>
    ),
    <Form<UsernameSettingsSchema>
      className={clsx("flex-col")}
      disabled={isLoading}
      on_submit={handleSubmit}
      provider_props={form}
    >
      <UsernameSettingsModal />
    </Form>,
    {
      fullscreen: is_smaller_than_mobile,
      footer: (
        <>
          <ModalFooterButton compact={is_smaller_than_mobile} variant={"ghost"}>
            Cancel
          </ModalFooterButton>
          <ModalFooterButton
            compact={is_smaller_than_mobile}
            disabled={!form.formState.isDirty}
            loading={isLoading}
            onClick={(event): void => {
              event.preventDefault(); // Prevent closing of modal
              form.handleSubmit(handleSubmit)(); // Submit manually
            }}
          >
            Confirm
          </ModalFooterButton>
        </>
      ),
      slot_props: {
        footer: {
          compact: is_smaller_than_mobile
        },
        content: {
          style: {
            width: is_smaller_than_mobile ? "100%" : "350px"
          }
        },
        header: {
          decorator: <AtIcon />,
          children: "Change your username"
        }
      }
    }
  );

  return element;
};

export default UsernameSettings;
