import { clsx } from "clsx";
import React from "react";

import Form, { SubmitHandler, useForm, zodResolver } from "~/components/Form";
import FormSwitch from "~/components/FormSwitch";
import Spacer from "~/components/Spacer";
import { useToast } from "~/components/Toast";
import Typography from "~/components/Typography";
import { use_sensitive_content_mutation } from "~/redux/features";

import styles from "../site-safety.module.scss";
import { SensitiveContentProps } from "./sensitive-content.props";
import {
  SensitiveContentSchema,
  sensitiveContentSchema
} from "./sensitive-content.schema";

const SensitiveContent = ({
  onSubmit,
  allow_sensitive_media
}: SensitiveContentProps): React.ReactElement => {
  const toast = useToast();
  const prevValuesRef = React.useRef<SensitiveContentSchema>();
  const form = useForm<SensitiveContentSchema>({
    resolver: zodResolver(sensitiveContentSchema),
    defaultValues: {
      "sensitive-content": allow_sensitive_media
    }
  });
  const [mutateSensitiveContent, { isLoading }] =
    use_sensitive_content_mutation();

  const handleSubmit: SubmitHandler<SensitiveContentSchema> = (values) => {
    if (onSubmit) {
      onSubmit(values);
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
        onSubmit={handleSubmit}
        providerProps={form}
      >
        <FormSwitch
          helperText={
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
