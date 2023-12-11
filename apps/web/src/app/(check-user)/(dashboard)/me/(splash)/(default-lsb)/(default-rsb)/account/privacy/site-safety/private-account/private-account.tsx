import { clsx } from "clsx";
import { useRouter as use_router } from "next/navigation";
import React from "react";

import { use_confirmation } from "~/components/confirmation";
import Form, { SubmitHandler, use_form, zod_resolver } from "~/components/form";
import FormSwitch from "~/components/form-switch";
import Link from "~/components/link";
import Spacer from "~/components/spacer";
import { use_toast } from "~/components/toast";
import Typography from "~/components/typography";
import LockIcon from "~/icons/lock";
import LockOpenIcon from "~/icons/lock-open";
import { use_private_account_mutation } from "~/redux/features";
import css from "~/theme/main.module.scss";
import { handle_api_error } from "~/utils/handle-api-error";

import styles from "../site-safety.module.scss";
import { PrivateAccountProps } from "./private-account.props";
import {
  PRIVATE_ACCOUNT_SCHEMA,
  PrivateAccountSchema
} from "./private-account.schema";

const PrivateAccount = ({
  on_submit,
  is_private_account
}: PrivateAccountProps): React.ReactElement => {
  const toast = use_toast();
  const router = use_router();
  const form = use_form<PrivateAccountSchema>({
    resolver: zod_resolver(PRIVATE_ACCOUNT_SCHEMA),
    defaultValues: {
      private_account: is_private_account
    }
  });
  const value = form.watch("private_account");
  const [mutate_private_account, { isLoading: is_loading }] =
    use_private_account_mutation();

  const handle_submit: SubmitHandler<PrivateAccountSchema> = (values) => {
    if (on_submit) {
      on_submit(values);
    } else {
      open();
    }
  };

  /**
   * Handles confirmation
   */
  const handle_confirm = (): void => {
    mutate_private_account({
      private_account: value
    })
      .unwrap()
      .then(() => router.refresh())
      .catch((error) => {
        form.reset();

        handle_api_error(
          error,
          toast,
          form,
          "Could not change your account type"
        );
      });
  };

  const [element, open] = use_confirmation(
    () => (
      <div onClick={(event): void => event.preventDefault()} tabIndex={-1}>
        <FormSwitch
          helper_text={
            <React.Fragment>
              When your account is set to public, anyone can view your profile
              and read your stories, even without logging in to Storiny.
              <br />
              <br />
              Switching to a private account gives you complete control over the
              content you share by restricting your profile, stories, and other
              public content to your friends.
              <br />
              <br />
              When you switch to a private account, your stories will no longer
              be included in the search results.{" "}
              <Link href={"/guide/private-accounts"} underline={"always"}>
                Learn more about private accounts
              </Link>
              .
            </React.Fragment>
          }
          label={"Private account"}
          name={"private_account"}
          onCheckedChange={(): void => {
            form.handleSubmit(handle_submit)();
          }}
        />
      </div>
    ),
    {
      on_cancel: (): void =>
        form.reset({ private_account: is_private_account }),
      on_confirm: handle_confirm,
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
        className={clsx(css["flex-col"], styles.x, styles.form)}
        disabled={is_loading}
        on_submit={handle_submit}
        provider_props={form}
      >
        {element}
      </Form>
    </React.Fragment>
  );
};

export default PrivateAccount;
