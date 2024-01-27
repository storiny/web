import { IncomingCollaborationRequest } from "@storiny/shared";
import { clsx } from "clsx";
import React from "react";

import Form, { SubmitHandler, use_form, zod_resolver } from "~/components/form";
import FormRadio from "~/components/form-radio";
import FormRadioGroup from "~/components/form-radio-group";
import Spacer from "~/components/spacer";
import { use_toast } from "~/components/toast";
import Typography from "~/components/typography";
import { use_incoming_collaboration_requests_mutation } from "~/redux/features";
import css from "~/theme/main.module.scss";
import { handle_api_error } from "~/utils/handle-api-error";

import styles from "../site-safety.module.scss";
import { CollaborationRequestsProps } from "./collaboration-requests.props";
import {
  COLLABORATION_REQUESTS_SCHEMA,
  CollaborationRequestsSchema
} from "./collaboration-requests.schema";

const CollaborationRequests = ({
  on_submit,
  incoming_collaboration_requests
}: CollaborationRequestsProps): React.ReactElement => {
  const toast = use_toast();
  const prev_values_ref = React.useRef<CollaborationRequestsSchema>();
  const form = use_form<CollaborationRequestsSchema>({
    resolver: zod_resolver(COLLABORATION_REQUESTS_SCHEMA),
    defaultValues: {
      collaboration_requests: `${incoming_collaboration_requests}` as `${
        | 1
        | 2
        | 3
        | 4}`
    }
  });
  const [mutate_incoming_collaboration_requests, { isLoading: is_loading }] =
    use_incoming_collaboration_requests_mutation();

  const handle_submit: SubmitHandler<CollaborationRequestsSchema> = (
    values
  ) => {
    if (on_submit) {
      on_submit(values);
    } else {
      mutate_incoming_collaboration_requests(values)
        .unwrap()
        .then(() => (prev_values_ref.current = values))
        .catch((error) => {
          form.reset(prev_values_ref.current);

          handle_api_error(
            error,
            toast,
            form,
            "Could not change your collaboration request settings"
          );
        });
    }
  };

  return (
    <React.Fragment>
      <Typography as={"h3"} level={"h6"}>
        Collaboration requests
      </Typography>
      <Spacer orientation={"vertical"} size={0.5} />
      <Typography className={css["t-minor"]} level={"body2"}>
        Choose who can send you a collaboration request, asking you to
        contribute to their stories.
      </Typography>
      <Spacer orientation={"vertical"} />
      <Form<CollaborationRequestsSchema>
        className={clsx(css["flex-col"], styles.x, styles.form)}
        disabled={is_loading}
        on_submit={handle_submit}
        provider_props={form}
      >
        <FormRadioGroup
          auto_size
          className={clsx(styles.x, styles["radio-group"])}
          name={"collaboration_requests"}
          onValueChange={(): void => {
            form.handleSubmit(handle_submit)();
          }}
        >
          <FormRadio
            aria-label={"Everyone"}
            label={"Everyone"}
            value={`${IncomingCollaborationRequest.EVERYONE}`}
          />
          <FormRadio
            aria-label={"Users I follow"}
            label={"Users I follow"}
            value={`${IncomingCollaborationRequest.FOLLOWING}`}
          />
          <FormRadio
            aria-label={"Friends"}
            label={"Friends"}
            value={`${IncomingCollaborationRequest.FRIENDS}`}
          />
          <FormRadio
            aria-label={"No one"}
            label={"No one"}
            value={`${IncomingCollaborationRequest.NONE}`}
          />
        </FormRadioGroup>
      </Form>
    </React.Fragment>
  );
};

export default CollaborationRequests;
