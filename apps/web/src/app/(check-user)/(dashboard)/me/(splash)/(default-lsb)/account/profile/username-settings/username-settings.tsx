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
import { mutateUser, useUsernameSettingsMutation } from "~/redux/features";
import { useAppDispatch } from "~/redux/hooks";
import { breakpoints } from "~/theme/breakpoints";

import { UsernameSettingsSchema, usernameSettingsSchema } from "./schema";

interface Props {
  onSubmit?: SubmitHandler<UsernameSettingsSchema>;
}

const UsernameSettingsModal = (): React.ReactElement => {
  const isSmallerThanTablet = useMediaQuery(breakpoints.down("tablet"));
  return (
    <React.Fragment>
      <Description asChild>
        <Typography className={"t-minor"} level={"body2"}>
          Enter your new username along with your existing password.
        </Typography>
      </Description>
      <Spacer orientation={"vertical"} size={5} />
      <FormInput
        autoComplete={"username"}
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
        size={isSmallerThanTablet ? "lg" : "md"}
      />
      <Spacer orientation={"vertical"} size={3} />
      <FormPasswordInput
        data-testid={"current-password-input"}
        formSlotProps={{
          formItem: {
            className: "f-grow"
          }
        }}
        label={"Current password"}
        name={"current-password"}
        placeholder={"Your current password"}
        required
        size={isSmallerThanTablet ? "lg" : "md"}
      />
    </React.Fragment>
  );
};

const UsernameSettings = ({ onSubmit }: Props): React.ReactElement => {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const isSmallerThanMobile = useMediaQuery(breakpoints.down("mobile"));
  const form = useForm<UsernameSettingsSchema>({
    resolver: zodResolver(usernameSettingsSchema),
    defaultValues: {
      "new-username": "",
      "current-password": ""
    }
  });
  const [usernameSettings, { isLoading }] = useUsernameSettingsMutation();

  const handleSubmit: SubmitHandler<UsernameSettingsSchema> = (values) => {
    if (onSubmit) {
      onSubmit(values);
    } else {
      usernameSettings(values)
        .unwrap()
        .then(() => {
          dispatch(
            mutateUser({
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
      <Button className={"fit-w"} onClick={openModal} variant={"hollow"}>
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
      slotProps: {
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
