import { clsx } from "clsx";
import React from "react";

import Form, { SubmitHandler, useForm, zodResolver } from "~/components/Form";
import FormSwitch from "~/components/FormSwitch";
import Spacer from "~/components/Spacer";
import { useToast } from "~/components/Toast";
import Typography from "~/components/Typography";
import { use_read_history_mutation } from "~/redux/features";

import styles from "../site-safety.module.scss";
import { AccountHistoryProps } from "./account-history.props";
import {
  AccountHistorySchema,
  accountHistorySchema
} from "./account-history.schema";

const AccountHistory = ({
  onSubmit,
  record_read_history
}: AccountHistoryProps): React.ReactElement => {
  const toast = useToast();
  const prevValuesRef = React.useRef<AccountHistorySchema>();
  const form = useForm<AccountHistorySchema>({
    resolver: zodResolver(accountHistorySchema),
    defaultValues: {
      "read-history": !record_read_history
    }
  });
  const [mutateReadHistory, { isLoading }] = use_read_history_mutation();

  const handleSubmit: SubmitHandler<AccountHistorySchema> = (values) => {
    if (onSubmit) {
      onSubmit({ "read-history": !values["read-history"] });
    } else {
      mutateReadHistory({ "read-history": !values["read-history"] })
        .unwrap()
        .then(() => (prevValuesRef.current = values))
        .catch((e) => {
          form.reset(prevValuesRef.current);
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
        disabled={isLoading}
        onSubmit={handleSubmit}
        providerProps={form}
      >
        <FormSwitch
          helperText={
            <React.Fragment>
              You can disable read history to enjoy a more discreet and
              anonymous browsing experience. Please note that this will affect
              your recommendations and home feed, and you might encounter more
              unpersonalized content.
            </React.Fragment>
          }
          label={"Disable read history"}
          name={"read-history"}
          onCheckedChange={(): void => {
            form.handleSubmit(handleSubmit)();
          }}
        />
      </Form>
    </React.Fragment>
  );
};

export default AccountHistory;
