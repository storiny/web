import { clsx } from "clsx";
import React from "react";

import Button from "~/components/Button";
import Form, { SubmitHandler, useForm, zodResolver } from "~/components/Form";
import FormInput from "~/components/FormInput";
import { Description, ModalFooterButton, useModal } from "~/components/Modal";
import Spacer from "~/components/Spacer";
import { useToast } from "~/components/Toast";
import Typography from "~/components/Typography";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import TwoFAIcon from "~/icons/TwoFA";
import { useRemoveMfaMutation } from "~/redux/features";
import { breakpoints } from "~/theme/breakpoints";

import { Remove2FAProps } from "./remove-2fa.props";
import {
  RECOVERY_CODE_MAX_LENGTH,
  RECOVERY_CODE_MIN_LENGTH,
  Remove2FASchema,
  remove2faSchema
} from "./remove-2fa.schema";

const Remove2FAModal = (): React.ReactElement => (
  <React.Fragment>
    <Description asChild>
      <Typography className={"t-minor"} level={"body2"}>
        Without two-factor authentication, your account will only be protected
        by your password. To disable two-factor authentication, provide your
        6-digit authentication code or one of your 8-digit recovery codes.
      </Typography>
    </Description>
    <Spacer orientation={"vertical"} size={5} />
    <FormInput
      autoComplete={"one-time-code"}
      autoFocus
      autoSize
      data-testid={"code-input"}
      formSlotProps={{
        formItem: {
          className: "f-grow"
        }
      }}
      label={"Code"}
      maxLength={RECOVERY_CODE_MAX_LENGTH}
      minLength={RECOVERY_CODE_MIN_LENGTH}
      name={"code"}
      placeholder={"6-digit authentication or 8-digit backup code"}
      required
    />
    <Spacer orientation={"vertical"} size={2} />
  </React.Fragment>
);

const Remove2FA = ({
  onSubmit,
  setEnabled
}: Remove2FAProps): React.ReactElement => {
  const toast = useToast();
  const isSmallerThanMobile = useMediaQuery(breakpoints.down("mobile"));
  const form = useForm<Remove2FASchema>({
    resolver: zodResolver(remove2faSchema),
    defaultValues: {
      code: ""
    }
  });
  const [removeMfa, { isLoading }] = useRemoveMfaMutation();

  const handleSubmit: SubmitHandler<Remove2FASchema> = (values) => {
    if (onSubmit) {
      onSubmit(values);
    } else {
      removeMfa(values)
        .unwrap()
        .then(() => {
          setEnabled(false);
          toast("Successfully disabled two-factor authentication", "success");
        })
        .catch((e) => {
          toast(
            e?.data?.error || "Could not disable two-factor authentication",
            "error"
          );
        });
    }
  };

  const [element] = useModal(
    ({ openModal }) => (
      <Button
        autoSize
        className={"fit-w"}
        color={"ruby"}
        onClick={openModal}
        variant={"hollow"}
      >
        Remove 2FA
      </Button>
    ),
    <Form<Remove2FASchema>
      className={clsx("flex-col")}
      disabled={isLoading}
      onSubmit={handleSubmit}
      providerProps={form}
    >
      <Remove2FAModal />
    </Form>,
    {
      fullscreen: isSmallerThanMobile,
      footer: (
        <>
          <ModalFooterButton compact={isSmallerThanMobile} variant={"ghost"}>
            Cancel
          </ModalFooterButton>
          <ModalFooterButton
            color={"ruby"}
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
          decorator: <TwoFAIcon />,
          children: "Remove 2FA"
        }
      }
    }
  );

  return element;
};

export default Remove2FA;
