import { clsx } from "clsx";
import React from "react";

import Form, { SubmitHandler, use_form, zod_resolver } from "~/components/form";
import FormSwitch from "~/components/form-switch";
import Spacer from "~/components/spacer";
import { use_toast } from "~/components/toast";
import Typography from "~/components/typography";
import { use_read_history_mutation } from "~/redux/features";

import styles from "../site-safety.module.scss";
import { AccountHistory_props } from "./account-history.props";
import {
  AccountHistorySchema,
  ACCOUNT_HISTORY_SCHEMA
} from "./account-history.schema";

const AccountHistory = ({
  on_submit,
  record_read_history
}: AccountHistory_props): React.ReactElement => {
  const toast = use_toast();
  const prev_values_ref = React.useRef<AccountHistorySchema>();
  const form = use_form<AccountHistorySchema>({
    resolver: zod_resolver(ACCOUNT_HISTORY_SCHEMA),
    defaultValues: {
      read_history: !record_read_history
    }
  });
  const [mutate_read_history, { isLoading: is_loading }] =
    use_read_history_mutation();

  const handle_submit: SubmitHandler<AccountHistorySchema> = (values) => {
    if (on_submit) {
      on_submit({ read_history: !values["read_history"] });
    } else {
      mutate_read_history({ read_history: !values["read_history"] })
        .unwrap()
        .then(() => (prev_values_ref.current = values))
        .catch((e) => {
          form.reset(prev_values_ref.current);
          toast(
            e?.data?.error || "Could not change your history settings",
            "error"
          );
        });
    }
  };

  return (
    <React.Fragment>
      <Typography as={"h3"} level={"h6"}>
        Account history
      </Typography>
      <Spacer orientation={"vertical"} size={0.5} />
      <Form<AccountHistorySchema>
        className={clsx("flex-col", styles.x, styles.form)}
        disabled={is_loading}
        on_submit={handle_submit}
        provider_props={form}
      >
        <FormSwitch
          helper_text={
            <React.Fragment>
              You can disable read history to enjoy a more discreet and
              anonymous browsing experience. Please note that this will affect
              your recommendations and home feed, and you might encounter more
              unpersonalized content.
            </React.Fragment>
          }
          label={"Disable read history"}
          name={"read_history"}
          onCheckedChange={(): void => {
            form.handleSubmit(handle_submit)();
          }}
        />
      </Form>
    </React.Fragment>
  );
};

export default AccountHistory;
