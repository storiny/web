import { clsx } from "clsx";
import React from "react";

import { GetPrivacySettingsResponse } from "~/common/grpc";
import Form, { SubmitHandler, useForm, zodResolver } from "~/components/Form";
import FormSwitch from "~/components/FormSwitch";
import Spacer from "~/components/Spacer";
import { useToast } from "~/components/Toast";
import Typography from "~/components/Typography";
import { useReadHistoryMutation } from "~/redux/features";

import styles from "../site-safety.module.scss";
import { AccountHistorySchema, accountHistorySchema } from "./schema";

type Props = {
  onSubmit?: SubmitHandler<AccountHistorySchema>;
} & Pick<GetPrivacySettingsResponse, "record_read_history">;

const PrivateAccount = ({
  onSubmit,
  record_read_history
}: Props): React.ReactElement => {
  const toast = useToast();
  const form = useForm<AccountHistorySchema>({
    resolver: zodResolver(accountHistorySchema),
    defaultValues: {
      "read-history": !record_read_history
    }
  });
  const [readHistory, { isLoading }] = useReadHistoryMutation();

  const handleSubmit: SubmitHandler<AccountHistorySchema> = (values) => {
    if (onSubmit) {
      onSubmit({ "read-history": !values["read-history"] });
    } else {
      readHistory({ "read-history": !values["read-history"] })
        .unwrap()
        .then(() => toast("History settings updated", "success"))
        .catch((e) => {
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
        className={clsx("flex-col", styles.form)}
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

export default PrivateAccount;
