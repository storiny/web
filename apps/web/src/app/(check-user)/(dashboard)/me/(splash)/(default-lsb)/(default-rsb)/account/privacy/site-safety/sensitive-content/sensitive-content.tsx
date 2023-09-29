import { clsx } from "clsx";
import React from "react";

import Form, {
  SubmitHandler,
  use_form,
  zod_resolver
} from "../../../../../../../../../../../../../../packages/ui/src/components/form";
import FormSwitch from "../../../../../../../../../../../../../../packages/ui/src/components/form-switch";
import Spacer from "../../../../../../../../../../../../../../packages/ui/src/components/spacer";
import { use_toast } from "../../../../../../../../../../../../../../packages/ui/src/components/toast";
import Typography from "../../../../../../../../../../../../../../packages/ui/src/components/typography";
import { use_sensitive_content_mutation } from "~/redux/features";

import styles from "../site-safety.module.scss";
import { SensitiveContentProps } from "./sensitive-content.props";
import {
  SensitiveContentSchema,
  sensitiveContentSchema
} from "./sensitive-content.schema";

const SensitiveContent = ({
  on_submit,
  allow_sensitive_media
}: SensitiveContentProps): React.ReactElement => {
  const toast = use_toast();
  const prevValuesRef = React.useRef<SensitiveContentSchema>();
  const form = use_form<SensitiveContentSchema>({
    resolver: zod_resolver(sensitiveContentSchema),
    defaultValues: {
      "sensitive-content": allow_sensitive_media
    }
  });
  const [mutateSensitiveContent, { isLoading }] =
    use_sensitive_content_mutation();

  const handleSubmit: SubmitHandler<SensitiveContentSchema> = (values) => {
    if (on_submit) {
      on_submit(values);
    } else {
      mutateSensitiveContent(values)
        .unwrap()
        .then(() => (prevValuesRef.current = values))
        .catch((e) => {
          form.reset(prevValuesRef.current);
          toast(
            e?.data?.error || "Could not change your sensitive media settings",
            "error"
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
        className={clsx("flex-col", styles.x, styles.form)}
        disabled={isLoading}
        on_submit={handleSubmit}
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
          name={"sensitive-content"}
          onCheckedChange={(): void => {
            form.handleSubmit(handleSubmit)();
          }}
        />
      </Form>
    </React.Fragment>
  );
};

export default SensitiveContent;
