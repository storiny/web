import { clsx } from "clsx";
import React from "react";

import Form, { SubmitHandler, use_form, zod_resolver } from "~/components/form";
import FormSwitch from "~/components/form-switch";
import Spacer from "~/components/spacer";
import { use_toast } from "~/components/toast";
import Typography from "~/components/typography";
import { use_sensitive_content_mutation } from "~/redux/features";
import css from "~/theme/main.module.scss";
import { handle_api_error } from "~/utils/handle-api-error";

import styles from "../site-safety.module.scss";
import { SensitiveContentProps } from "./sensitive-content.props";
import {
  SENSITIVE_CONTENT_SCHEMA,
  SensitiveContentSchema
} from "./sensitive-content.schema";

const SensitiveContent = ({
  on_submit,
  allow_sensitive_media
}: SensitiveContentProps): React.ReactElement => {
  const toast = use_toast();
  const prev_values_ref = React.useRef<SensitiveContentSchema>();
  const form = use_form<SensitiveContentSchema>({
    resolver: zod_resolver(SENSITIVE_CONTENT_SCHEMA),
    defaultValues: {
      sensitive_content: allow_sensitive_media
    }
  });
  const [mutate_sensitive_content, { isLoading: is_loading }] =
    use_sensitive_content_mutation();

  const handle_submit: SubmitHandler<SensitiveContentSchema> = (values) => {
    if (on_submit) {
      on_submit(values);
    } else {
      mutate_sensitive_content(values)
        .unwrap()
        .then(() => (prev_values_ref.current = values))
        .catch((error) => {
          form.reset(prev_values_ref.current);

          handle_api_error(
            error,
            toast,
            form,
            "Could not change your sensitive media settings"
          );
        });
    }
  };

  return (
    <React.Fragment>
      <Typography as={"h3"} level={"h6"}>
        Sensitive content
      </Typography>
      <Spacer orientation={"vertical"} size={0.5} />
      <Form<SensitiveContentSchema>
        className={clsx(css["flex-col"], styles.x, styles.form)}
        disabled={is_loading}
        on_submit={handle_submit}
        provider_props={form}
      >
        <FormSwitch
          helper_text={
            <React.Fragment>
              Allow images and other media containing suggestive nudity,
              violence, or sensitive content to be displayed in stories without
              a warning. This setting only affects the accounts on this browser.
            </React.Fragment>
          }
          label={"Display potentially sensitive media"}
          name={"sensitive_content"}
          onCheckedChange={(): void => {
            form.handleSubmit(handle_submit)();
          }}
        />
      </Form>
    </React.Fragment>
  );
};

export default SensitiveContent;
