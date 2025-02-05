import { IncomingBlogRequest } from "@storiny/shared";
import { clsx } from "clsx";
import React from "react";

import Form, { SubmitHandler, use_form, zod_resolver } from "~/components/form";
import FormRadio from "~/components/form-radio";
import FormRadioGroup from "~/components/form-radio-group";
import Spacer from "~/components/spacer";
import { use_toast } from "~/components/toast";
import Typography from "~/components/typography";
import { use_incoming_blog_requests_mutation } from "~/redux/features";
import css from "~/theme/main.module.scss";
import { handle_api_error } from "~/utils/handle-api-error";

import styles from "../site-safety.module.scss";
import { BlogRequestsProps } from "./blog-requests.props";
import {
  BLOG_REQUESTS_SCHEMA,
  BlogRequestsSchema
} from "./blog-requests.schema";

const BlogRequests = ({
  on_submit,
  incoming_blog_requests
}: BlogRequestsProps): React.ReactElement => {
  const toast = use_toast();
  const prev_values_ref = React.useRef<BlogRequestsSchema>(undefined);
  const form = use_form<BlogRequestsSchema>({
    resolver: zod_resolver(BLOG_REQUESTS_SCHEMA),
    defaultValues: {
      blog_requests: `${incoming_blog_requests}` as `${1 | 2 | 3 | 4}`
    }
  });
  const [mutate_incoming_blog_requests, { isLoading: is_loading }] =
    use_incoming_blog_requests_mutation();

  const handle_submit: SubmitHandler<BlogRequestsSchema> = (values) => {
    if (on_submit) {
      on_submit(values);
    } else {
      mutate_incoming_blog_requests(values)
        .unwrap()
        .then(() => (prev_values_ref.current = values))
        .catch((error) => {
          form.reset(prev_values_ref.current);

          handle_api_error(
            error,
            toast,
            form,
            "Could not change your blog request settings"
          );
        });
    }
  };

  return (
    <React.Fragment>
      <Typography as={"h3"} level={"h6"}>
        Blog requests
      </Typography>
      <Spacer orientation={"vertical"} size={0.5} />
      <Typography color={"minor"} level={"body2"}>
        Choose who can invite you as an editor or writer to their blogs.
      </Typography>
      <Spacer orientation={"vertical"} />
      <Form<BlogRequestsSchema>
        className={clsx(css["flex-col"], styles.x, styles.form)}
        disabled={is_loading}
        on_submit={handle_submit}
        provider_props={form}
      >
        <FormRadioGroup
          auto_size
          className={clsx(styles.x, styles["radio-group"])}
          name={"blog_requests"}
          onValueChange={(): void => {
            form.handleSubmit(handle_submit)();
          }}
        >
          <FormRadio
            aria-label={"Everyone"}
            label={"Everyone"}
            value={`${IncomingBlogRequest.EVERYONE}`}
          />
          <FormRadio
            aria-label={"Users I follow"}
            label={"Users I follow"}
            value={`${IncomingBlogRequest.FOLLOWING}`}
          />
          <FormRadio
            aria-label={"Friends"}
            label={"Friends"}
            value={`${IncomingBlogRequest.FRIENDS}`}
          />
          <FormRadio
            aria-label={"No one"}
            label={"No one"}
            value={`${IncomingBlogRequest.NONE}`}
          />
        </FormRadioGroup>
      </Form>
    </React.Fragment>
  );
};

export default BlogRequests;
