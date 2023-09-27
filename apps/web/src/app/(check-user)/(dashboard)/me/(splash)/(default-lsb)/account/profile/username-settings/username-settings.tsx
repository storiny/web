import { userProps } from "@storiny/shared";
import { clsx } from "clsx";
import React from "react";

import Button from "~/components/Button";
import Form, { SubmitHandler, useForm, zodResolver } from "~/components/Form";
import FormInput from "~/components/FormInput";
import FormPasswordInput from "~/components/FormPasswordInput";
import { Description, ModalFooterButton, useModal } from "~/components/Modal";
import Spacer from "~/components/Spacer";
import { useToast } from "~/components/Toast";
import Typography from "~/components/Typography";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import AtIcon from "~/icons/At";
import PasswordIcon from "~/icons/Password";
import { mutate_user, use_username_settings_mutation } from "~/redux/features";
import { use_app_dispatch } from "~/redux/hooks";
import { breakpoints } from "~/theme/breakpoints";

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
      autoSize
      data-testid={"new-username-input"}
      decorator={<AtIcon />}
      formSlotProps={{
        formItem: {
          className: "f-grow"
        }
      }}
      label={"New username"}
      maxLength={userProps.username.maxLength}
      minLength={userProps.username.minLength}
      name={"new-username"}
      placeholder={"Choose a new username"}
      required
    />
    <Spacer orientation={"vertical"} size={3} />
    <FormPasswordInput
      autoSize
      data-testid={"current-password-input"}
      decorator={<PasswordIcon />}
      formSlotProps={{
        formItem: {
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
  onSubmit
}: UsernameSettingsProps): React.ReactElement => {
  const dispatch = use_app_dispatch();
  const toast = useToast();
  const isSmallerThanMobile = useMediaQuery(breakpoints.down("mobile"));
  const form = useForm<UsernameSettingsSchema>({
    resolver: zodResolver(usernameSettingsSchema),
    defaultValues: {
      "new-username": "",
      "current-password": ""
    }
  });
  const [mutateUsernameSettings, { isLoading }] =
    use_username_settings_mutation();

  const handleSubmit: SubmitHandler<UsernameSettingsSchema> = (values) => {
    if (onSubmit) {
      onSubmit(values);
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
          closeModal();
          toast("Username updated successfully", "success");
        })
        .catch((e) => {
          toast(e?.data?.error || "Could not update your username", "error");
        });
    }
  };

  const [element, , closeModal] = useModal(
    ({ openModal }) => (
      <Button
        checkAuth
        className={"fit-w"}
        onClick={openModal}
        variant={"hollow"}
      >
        Change username
      </Button>
    ),
    <Form<UsernameSettingsSchema>
      className={clsx("flex-col")}
      disabled={isLoading}
      onSubmit={handleSubmit}
      providerProps={form}
    >
      <UsernameSettingsModal />
    </Form>,
    {
      fullscreen: isSmallerThanMobile,
      footer: (
        <>
          <ModalFooterButton compact={isSmallerThanMobile} variant={"ghost"}>
            Cancel
          </ModalFooterButton>
          <ModalFooterButton
            compact={isSmallerThanMobile}
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
          compact: isSmallerThanMobile
        },
        content: {
          style: {
            width: isSmallerThanMobile ? "100%" : "350px"
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
