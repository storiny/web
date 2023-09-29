import { clsx } from "clsx";
import { useRouter } from "next/navigation";
import React from "react";

import Button from "../../../../../../../../../../../../../../packages/ui/src/components/button";
import Form, {
  SubmitHandler,
  use_form,
  zod_resolver
} from "../../../../../../../../../../../../../../packages/ui/src/components/form";
import FormNewPasswordInput from "../../../../../../../../../../../../../../packages/ui/src/components/form-new-password-input";
import FormPasswordInput from "../../../../../../../../../../../../../../packages/ui/src/components/form-password-input";
import {
  Description,
  ModalFooterButton,
  use_modal
} from "../../../../../../../../../../../../../../packages/ui/src/components/modal";
import Spacer from "../../../../../../../../../../../../../../packages/ui/src/components/spacer";
import { use_toast } from "../../../../../../../../../../../../../../packages/ui/src/components/toast";
import Typography from "../../../../../../../../../../../../../../packages/ui/src/components/typography";
import { use_media_query } from "../../../../../../../../../../../../../../packages/ui/src/hooks/use-media-query";
import PasswordIcon from "~/icons/Password";
import { use_update_password_mutation } from "~/redux/features";
import { BREAKPOINTS } from "~/theme/breakpoints";

import { UpdatePasswordProps } from "./update-password.props";
import {
  UpdatePasswordSchema,
  updatePasswordSchema
} from "./update-password.schema";

const UpdatePasswordModal = ({
  updated
}: {
  updated?: boolean;
}): React.ReactElement => (
  <React.Fragment>
    <Description asChild>
      <Typography className={"t-minor"} level={"body2"}>
        {updated
          ? "Your password has been updated. You have been logged out and will need to log in again using your new password."
          : "Enter a new password that is at least 6 characters long, along with your current password."}
      </Typography>
    </Description>
    <Spacer orientation={"vertical"} size={updated ? 2 : 5} />
    {!updated && (
      <React.Fragment>
        <FormPasswordInput
          autoFocus
          auto_size
          data-testid={"current-password-input"}
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
        <Spacer orientation={"vertical"} size={3} />
        <FormNewPasswordInput
          auto_size
          data-testid={"new-password-input"}
          form_slot_props={{
            form_item: {
              className: "f-grow"
            }
          }}
          label={"New password"}
          name={"new-password"}
          placeholder={"6+ characters"}
          required
        />
        <Spacer orientation={"vertical"} size={2} />
      </React.Fragment>
    )}
  </React.Fragment>
);

const UpdatePassword = ({
  on_submit
}: UpdatePasswordProps): React.ReactElement => {
  const router = useRouter();
  const toast = use_toast();
  const is_smaller_than_mobile = use_media_query(BREAKPOINTS.down("mobile"));
  const [updated, setUpdated] = React.useState<boolean>(false);
  const form = use_form<UpdatePasswordSchema>({
    resolver: zod_resolver(updatePasswordSchema),
    defaultValues: {
      "current-password": "",
      "new-password": ""
    }
  });
  const [updatePassword, { isLoading }] = use_update_password_mutation();

  const handleSubmit: SubmitHandler<UpdatePasswordSchema> = (values) => {
    if (on_submit) {
      on_submit(values);
    } else {
      updatePassword(values)
        .unwrap()
        .then(() => setUpdated(true))
        .catch((e) => {
          setUpdated(false);
          toast(e?.data?.error || "Could not update your password", "error");
        });
    }
  };

  const [element] = use_modal(
    ({ open_modal }) => (
      <Button
        auto_size
        check_auth
        className={"fit-w"}
        onClick={open_modal}
        variant={"hollow"}
      >
        Update password
      </Button>
    ),
    <Form<UpdatePasswordSchema>
      className={clsx("flex-col")}
      disabled={isLoading}
      on_submit={handleSubmit}
      provider_props={form}
    >
      <UpdatePasswordModal updated={updated} />
    </Form>,
    {
      onOpenChange: updated ? (): void => undefined : undefined,
      fullscreen: is_smaller_than_mobile,
      footer: (
        <>
          {!updated && (
            <ModalFooterButton
              compact={is_smaller_than_mobile}
              variant={"ghost"}
            >
              Cancel
            </ModalFooterButton>
          )}
          <ModalFooterButton
            compact={is_smaller_than_mobile}
            disabled={!updated && !form.formState.isDirty}
            loading={isLoading}
            onClick={(event): void => {
              event.preventDefault(); // Prevent closing of modal

              if (updated) {
                router.push("/logout");
              } else {
                form.handleSubmit(handleSubmit)(); // Submit manually
              }
            }}
          >
            {updated ? "Continue" : "Confirm"}
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
        close_button: {
          style: {
            display: updated ? "none" : "flex"
          }
        },
        header: {
          decorator: <PasswordIcon />,
          children: "Update your password"
        }
      }
    }
  );

  return element;
};

export default UpdatePassword;
