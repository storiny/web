import { clsx } from "clsx";
import { useRouter as use_router } from "next/navigation";
import React from "react";

import { use_confirmation } from "../../../../../../../../../../../../../../packages/ui/src/components/confirmation";
import Form, {
  SubmitHandler,
  use_form,
  zod_resolver
} from "../../../../../../../../../../../../../../packages/ui/src/components/form";
import FormSwitch from "../../../../../../../../../../../../../../packages/ui/src/components/form-switch";
import Link from "../../../../../../../../../../../../../../packages/ui/src/components/link";
import Spacer from "../../../../../../../../../../../../../../packages/ui/src/components/spacer";
import { use_toast } from "../../../../../../../../../../../../../../packages/ui/src/components/toast";
import Typography from "../../../../../../../../../../../../../../packages/ui/src/components/typography";
import LockIcon from "../../../../../../../../../../../../../../packages/ui/src/icons/lock";
import LockOpenIcon from "../../../../../../../../../../../../../../packages/ui/src/icons/lock-open";
import { use_private_account_mutation } from "~/redux/features";

import styles from "../site-safety.module.scss";
import { PrivateAccountProps } from "./private-account.props";
import {
  PrivateAccountSchema,
  PRIVATE_ACCOUNT_SCHEMA
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
      .catch((e) => {
        form.reset();
        toast(e?.data?.error || "Could not change your account type", "error");
      });
  };

  const [element, open] = use_confirmation(
    () => (
      <div onClick={(event): void => event.preventDefault()} tabIndex={-1}>
        <FormSwitch
          helper_text={
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
        className={clsx("flex-col", styles.x, styles.form)}
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
