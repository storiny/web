import { clsx } from "clsx";
import React from "react";

import Button from "~/components/Button";
import Form, { SubmitHandler, useForm, zodResolver } from "~/components/Form";
import FormPasswordInput from "~/components/FormPasswordInput";
import { Description, ModalFooterButton, useModal } from "~/components/Modal";
import Spacer from "~/components/Spacer";
import { useToast } from "~/components/Toast";
import Typography from "~/components/Typography";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import PasswordIcon from "~/icons/Password";
import UnlinkIcon from "~/icons/Unlink";
import { use_remove_account_mutation } from "~/redux/features";
import { breakpoints } from "~/theme/breakpoints";

import { RemoveAccountProps } from "./remove-account.props";
import {
  RemoveAccountSchema,
  removeAccountSchema
} from "./remove-account.schema";

const RemoveAccountModal = (): React.ReactElement => (
  <React.Fragment>
    <Description asChild>
      <Typography className={"t-minor"} level={"body2"}>
        This will disconnect your Apple account from your Storiny account, and
        you will no longer be able to sign in to Storiny with your Apple account
        unless you connect it again.
      </Typography>
    </Description>
    <Spacer orientation={"vertical"} size={5} />
    <FormPasswordInput
      autoSize
      data-testid={"current-password-input"}
      decorator={<PasswordIcon />}
      formSlotProps={{
        formItem: {
          className: "f-grow"
        }
      }}
      label={"Password"}
      name={"current-password"}
      placeholder={"Your password"}
      required
    />
    <Spacer orientation={"vertical"} size={2} />
  </React.Fragment>
);

const RemoveAccount = ({
  onSubmit,
  vendor,
  onRemove
}: RemoveAccountProps): React.ReactElement => {
  const toast = useToast();
  const isSmallerThanMobile = useMediaQuery(breakpoints.down("mobile"));
  const [updated, setUpdated] = React.useState<boolean>(false);
  const form = useForm<RemoveAccountSchema>({
    resolver: zodResolver(removeAccountSchema),
    defaultValues: {
      "current-password": ""
    }
  });
  const [removeAccount, { isLoading }] = use_remove_account_mutation();

  const handleSubmit: SubmitHandler<RemoveAccountSchema> = (values) => {
    if (onSubmit) {
      onSubmit(values);
    } else {
      removeAccount({
        ...values,
        vendor: vendor.toLowerCase() as "google" | "apple"
      })
        .unwrap()
        .then(() => {
          closeModal();
          toast(`Removed your ${vendor} account`, "success");
          onRemove();
        })
        .catch((e) => {
          setUpdated(false);
          toast(
            e?.data?.error || `Could not remove your ${vendor} account`,
            "error"
          );
        });
    }
  };

  const [element, , closeModal] = useModal(
    ({ openModal }) => (
      <Button
        autoSize
        checkAuth
        color={"ruby"}
        onClick={openModal}
        variant={"hollow"}
      >
        Disconnect
      </Button>
    ),
    <Form<RemoveAccountSchema>
      className={clsx("flex-col")}
      disabled={isLoading}
      onSubmit={handleSubmit}
      providerProps={form}
    >
      <RemoveAccountModal />
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
        closeButton: {
          style: {
            display: updated ? "none" : "flex"
          }
        },
        header: {
          decorator: <UnlinkIcon />,
          children: `Disconnect ${vendor}`
        }
      }
    }
  );

  return element;
};

export default RemoveAccount;
