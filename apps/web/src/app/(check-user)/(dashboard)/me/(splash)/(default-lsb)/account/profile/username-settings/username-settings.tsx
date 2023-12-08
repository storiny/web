import { USER_PROPS } from "@storiny/shared";
import React from "react";

import Button from "~/components/button";
import Form, { SubmitHandler, use_form, zod_resolver } from "~/components/form";
import FormInput from "~/components/form-input";
import FormPasswordInput from "~/components/form-password-input";
import { Description, ModalFooterButton, use_modal } from "~/components/modal";
import Spacer from "~/components/spacer";
import { use_toast } from "~/components/toast";
import Typography from "~/components/typography";
import { use_media_query } from "~/hooks/use-media-query";
import AtIcon from "~/icons/at";
import PasswordIcon from "~/icons/password";
import { mutate_user, use_username_settings_mutation } from "~/redux/features";
import { use_app_dispatch } from "~/redux/hooks";
import { BREAKPOINTS } from "~/theme/breakpoints";
import css from "~/theme/main.module.scss";
import { handle_api_error } from "~/utils/handle-api-error";

import { UsernameSettingsProps } from "./username-settings.props";
import {
  USERNAME_SETTINGS_SCHEMA,
  UsernameSettingsSchema
} from "./username-settings.schema";

const UsernameSettingsModal = (): React.ReactElement => (
  <React.Fragment>
    <Description asChild>
      <Typography className={css["t-minor"]} level={"body2"}>
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
          className: css["f-grow"]
        }
      }}
      label={"New username"}
      maxLength={USER_PROPS.username.max_length}
      minLength={USER_PROPS.username.min_length}
      name={"new_username"}
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
          className: css["f-grow"]
        }
      }}
      label={"Current password"}
      name={"current_password"}
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
    resolver: zod_resolver(USERNAME_SETTINGS_SCHEMA),
    defaultValues: {
      new_username: "",
      current_password: ""
    }
  });
  const [mutate_username_settings, { isLoading: is_loading }] =
    use_username_settings_mutation();

  const handle_submit: SubmitHandler<UsernameSettingsSchema> = (values) => {
    if (on_submit) {
      on_submit(values);
    } else {
      mutate_username_settings(values)
        .unwrap()
        .then(() => {
          dispatch(
            mutate_user({
              username: values["new_username"]
            })
          );
          form.reset(); // Reset with empty values
          close_modal();
          toast("Username updated successfully", "success");
        })
        .catch((error) => {
          handle_api_error(
            error,
            toast,
            form,
            "Could not update your username"
          );
        });
    }
  };

  const [element, , close_modal] = use_modal(
    ({ open_modal }) => (
      <Button
        check_auth
        className={css["fit-w"]}
        onClick={open_modal}
        variant={"hollow"}
      >
        Change username
      </Button>
    ),
    <Form<UsernameSettingsSchema>
      className={css["flex-col"]}
      disabled={is_loading}
      on_submit={handle_submit}
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
            loading={is_loading}
            onClick={(event): void => {
              event.preventDefault(); // Prevent closing of modal
              form.handleSubmit(handle_submit)(); // Submit manually
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
