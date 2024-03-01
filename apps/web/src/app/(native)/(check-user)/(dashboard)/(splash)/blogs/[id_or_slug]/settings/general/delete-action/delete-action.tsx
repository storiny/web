import React from "react";

import { use_blog_context } from "~/common/context/blog";
import { use_app_router } from "~/common/utils";
import Button from "~/components/button";
import Form, { SubmitHandler, use_form, zod_resolver } from "~/components/form";
import FormPasswordInput from "~/components/form-password-input";
import { Description, ModalFooterButton, use_modal } from "~/components/modal";
import Spacer from "~/components/spacer";
import { use_toast } from "~/components/toast";
import Typography from "~/components/typography";
import { use_media_query } from "~/hooks/use-media-query";
import PasswordIcon from "~/icons/password";
import TrashIcon from "~/icons/trash";
import { use_delete_blog_mutation } from "~/redux/features";
import { BREAKPOINTS } from "~/theme/breakpoints";
import css from "~/theme/main.module.scss";
import { handle_api_error } from "~/utils/handle-api-error";

import { DeleteActionProps } from "./delete-action.props";
import {
  BLOG_DELETE_ACTION_SCHEMA,
  BlogDeleteActionSchema
} from "./delete-action.schema";

const DeleteBlogModal = (): React.ReactElement => (
  <React.Fragment>
    <Description asChild>
      <Typography color={"minor"} level={"body2"}>
        You need to confirm your password to delete this blog.
      </Typography>
    </Description>
    <Spacer orientation={"vertical"} size={5} />
    <FormPasswordInput
      auto_size
      data-testid={"current-password-input"}
      decorator={<PasswordIcon />}
      form_slot_props={{
        form_item: {
          className: css["f-grow"]
        }
      }}
      label={"Password"}
      name={"current_password"}
      placeholder={"Your password"}
      required
    />
    <Spacer orientation={"vertical"} size={2} />
  </React.Fragment>
);

const DeleteAction = ({ on_submit }: DeleteActionProps): React.ReactElement => {
  const toast = use_toast();
  const router = use_app_router();
  const blog = use_blog_context();
  const is_smaller_than_mobile = use_media_query(BREAKPOINTS.down("mobile"));
  const [done, set_done] = React.useState<boolean>(false);
  const form = use_form<BlogDeleteActionSchema>({
    resolver: zod_resolver(BLOG_DELETE_ACTION_SCHEMA),
    defaultValues: {
      current_password: ""
    }
  });
  const [delete_blog, { isLoading: is_loading }] = use_delete_blog_mutation();

  const handle_submit: SubmitHandler<BlogDeleteActionSchema> = (values) => {
    if (on_submit) {
      on_submit(values);
    } else {
      delete_blog({
        ...values,
        blog_id: blog.id
      })
        .unwrap()
        .then(() => {
          set_done(true);
          router.replace("/"); // Home page
          router.refresh(); // Refresh the state
        })
        .catch((error) => {
          handle_api_error(error, toast, form, "Could not delete your blog");
        });
    }
  };

  const [element] = use_modal(
    ({ open_modal }) => (
      <Button
        auto_size
        check_auth
        className={css["fit-w"]}
        color={"ruby"}
        onClick={open_modal}
        variant={"hollow"}
      >
        Delete this blog
      </Button>
    ),
    <Form<BlogDeleteActionSchema>
      className={css["flex-col"]}
      disabled={is_loading}
      on_submit={handle_submit}
      provider_props={form}
    >
      <DeleteBlogModal />
    </Form>,
    {
      fullscreen: is_smaller_than_mobile,
      footer: (
        <>
          <ModalFooterButton
            compact={is_smaller_than_mobile}
            disabled={done}
            variant={"ghost"}
          >
            Cancel
          </ModalFooterButton>
          <ModalFooterButton
            color={"ruby"}
            compact={is_smaller_than_mobile}
            disabled={done || !form.formState.isDirty}
            loading={is_loading}
            onClick={(event): void => {
              event.preventDefault(); // Prevent closing of modal
              form.handleSubmit(handle_submit)(); // Submit manually
            }}
          >
            Confirm
          </ModalFooterButton>
        </>
      ),
      slot_props: {
        footer: {
          compact: is_smaller_than_mobile
        },
        content: {
          style: {
            width: is_smaller_than_mobile ? "100%" : "350px"
          }
        },
        header: {
          decorator: <TrashIcon />,
          children: "Delete your blog"
        }
      }
    }
  );

  return element;
};

export default DeleteAction;
