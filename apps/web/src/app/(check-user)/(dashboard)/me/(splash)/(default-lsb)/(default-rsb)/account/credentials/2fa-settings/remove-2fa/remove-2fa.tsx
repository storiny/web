import { clsx } from "clsx";
import React from "react";

import Button from "../../../../../../../../../../../../../../packages/ui/src/components/button";
import Form, {
  SubmitHandler,
  use_form,
  zod_resolver
} from "../../../../../../../../../../../../../../packages/ui/src/components/form";
import FormInput from "../../../../../../../../../../../../../../packages/ui/src/components/form-input";
import {
  Description,
  ModalFooterButton,
  use_modal
} from "../../../../../../../../../../../../../../packages/ui/src/components/modal";
import Spacer from "../../../../../../../../../../../../../../packages/ui/src/components/spacer";
import { use_toast } from "../../../../../../../../../../../../../../packages/ui/src/components/toast";
import Typography from "../../../../../../../../../../../../../../packages/ui/src/components/typography";
import { use_media_query } from "../../../../../../../../../../../../../../packages/ui/src/hooks/use-media-query";
import TwoFAIcon from "~/icons/TwoFA";
import { use_remove_mfa_mutation } from "~/redux/features";
import { BREAKPOINTS } from "~/theme/breakpoints";

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
      auto_size
      data-testid={"code-input"}
      form_slot_props={{
        form_item: {
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
  on_submit,
  setEnabled
}: Remove2FAProps): React.ReactElement => {
  const toast = use_toast();
  const is_smaller_than_mobile = use_media_query(BREAKPOINTS.down("mobile"));
  const form = use_form<Remove2FASchema>({
    resolver: zod_resolver(remove2faSchema),
    defaultValues: {
      code: ""
    }
  });
  const [removeMfa, { isLoading }] = use_remove_mfa_mutation();

  const handleSubmit: SubmitHandler<Remove2FASchema> = (values) => {
    if (on_submit) {
      on_submit(values);
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

  const [element] = use_modal(
    ({ open_modal }) => (
      <Button
        auto_size
        check_auth
        className={"fit-w"}
        color={"ruby"}
        onClick={open_modal}
        variant={"hollow"}
      >
        Remove 2FA
      </Button>
    ),
    <Form<Remove2FASchema>
      className={clsx("flex-col")}
      disabled={isLoading}
      on_submit={handleSubmit}
      provider_props={form}
    >
      <Remove2FAModal />
    </Form>,
    {
      fullscreen: is_smaller_than_mobile,
      footer: (
        <>
          <ModalFooterButton compact={is_smaller_than_mobile} variant={"ghost"}>
            Cancel
          </ModalFooterButton>
          <ModalFooterButton
            color={"ruby"}
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
          decorator: <TwoFAIcon />,
          children: "Remove 2FA"
        }
      }
    }
  );

  return element;
};

export default Remove2FA;
