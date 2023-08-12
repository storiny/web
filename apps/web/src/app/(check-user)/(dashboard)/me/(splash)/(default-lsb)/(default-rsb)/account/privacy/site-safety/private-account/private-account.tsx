import { clsx } from "clsx";
import React from "react";

import { GetPrivacySettingsResponse } from "~/common/grpc";
import { useConfirmation } from "~/components/Confirmation";
import Form, { SubmitHandler, useForm, zodResolver } from "~/components/Form";
import FormSwitch from "~/components/FormSwitch";
import Link from "~/components/Link";
import Spacer from "~/components/Spacer";
import { useToast } from "~/components/Toast";
import Typography from "~/components/Typography";
import LockIcon from "~/icons/Lock";
import LockOpenIcon from "~/icons/LockOpen";
import { mutateUser, usePrivateAccountMutation } from "~/redux/features";
import { useAppDispatch } from "~/redux/hooks";

import styles from "../site-safety.module.scss";
import { PrivateAccountSchema, privateAccountSchema } from "./schema";

type Props = {
  onSubmit?: SubmitHandler<PrivateAccountSchema>;
} & Pick<GetPrivacySettingsResponse, "is_private_account">;

const PrivateAccount = ({
  onSubmit,
  is_private_account
}: Props): React.ReactElement => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const form = useForm<PrivateAccountSchema>({
    resolver: zodResolver(privateAccountSchema),
    defaultValues: {
      "private-account": is_private_account
    }
  });
  const value = form.watch("private-account");
  const [privateAccount, { isLoading }] = usePrivateAccountMutation();

  const handleSubmit: SubmitHandler<PrivateAccountSchema> = (values) => {
    if (onSubmit) {
      onSubmit(values);
    } else {
      open();
    }
  };

  /**
   * Handles confirmation
   */
  const handleConfirm = (): void => {
    privateAccount({
      "private-account": value
    })
      .unwrap()
      .then(() => {
        toast(`Account set to ${value ? "private" : "public"}`, "success");
        dispatch(
          mutateUser({
            is_private: value
          })
        );
      })
      .catch((e) => {
        toast(e?.data?.error || "Could not change your account type", "error");
      });
  };

  const [element, open] = useConfirmation(
    () => (
      <div onClick={(event): void => event.preventDefault()} tabIndex={-1}>
        <FormSwitch
          helperText={
            <React.Fragment>
              When your account is set to public, your profile is viewable by
              everyone, and anyone can read your stories, even without logging
              in to Storiny.
              <br />
              <br />
              Switching to a private account gives you complete control over the
              content you share since it limits access to your profile, stories,
              and relation lists to your friends.
              <br />
              <br />
              Furthermore, your stories will not be visible in search results,
              and any current contributors you have invited will have their
              access downgraded to view-only, except for your friends.{" "}
              <Link href={"/guide/private-accounts"} underline={"always"}>
                Learn more about private accounts
              </Link>
              .
            </React.Fragment>
          }
          label={"Private account"}
          name={"private-account"}
          onCheckedChange={(): void => {
            form.handleSubmit(handleSubmit)();
          }}
        />
      </div>
    ),
    {
      onCancel: (): void =>
        form.reset({ "private-account": is_private_account }),
      onConfirm: handleConfirm,
      decorator: value ? <LockIcon /> : <LockOpenIcon />,
      title: `Switch to ${value ? "private" : "public"} account?`,
      description: value
        ? "Your profile and stories will be immediately hidden from everyone except your friends."
        : "Your profile and stories will be immediately visible to everyone."
    }
  );

  return (
    <React.Fragment>
      <Typography as={"h3"} level={"h6"}>
        Account visibility
      </Typography>
      <Spacer orientation={"vertical"} size={0.5} />
      <Form<PrivateAccountSchema>
        className={clsx("flex-col", styles.form)}
        disabled={isLoading}
        onSubmit={handleSubmit}
        providerProps={form}
      >
        {element}
      </Form>
    </React.Fragment>
  );
};

export default PrivateAccount;
