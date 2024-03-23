import { USER_PROPS } from "@storiny/shared";
import { clsx } from "clsx";
import React from "react";

import { use_blog_context } from "~/common/context/blog";
import Button from "~/components/button";
import Form, { SubmitHandler, use_form, zod_resolver } from "~/components/form";
import FormInput from "~/components/form-input";
import IconButton from "~/components/icon-button";
import { Description, ModalFooterButton, use_modal } from "~/components/modal";
import Spacer from "~/components/spacer";
import { use_toast } from "~/components/toast";
import Typography from "~/components/typography";
import { use_media_query } from "~/hooks/use-media-query";
import AtIcon from "~/icons/at";
import PlusIcon from "~/icons/plus";
import SendIcon from "~/icons/send";
import {
  get_blog_editor_requests_api,
  use_invite_blog_editor_mutation
} from "~/redux/features";
import { use_app_dispatch } from "~/redux/hooks";
import { BREAKPOINTS } from "~/theme/breakpoints";
import css from "~/theme/main.module.scss";
import { handle_api_error } from "~/utils/handle-api-error";

import styles from "../styles.module.scss";
import { InviteEditorProps } from "./invite-editor.props";
import {
  INVITE_EDITOR_SCHEMA,
  InviteEditorSchema
} from "./invite-editor.schema";

const InviteEditorModal = (): React.ReactElement => (
  <React.Fragment>
    <Description asChild>
      <Typography color={"minor"} level={"body2"}>
        You can invite editors to this blog by searching for them using their
        Storiny usernames. However, if your account is private, you can only
        invite your friends.
      </Typography>
    </Description>
    <Spacer orientation={"vertical"} size={5} />
    <FormInput
      autoComplete={"username"}
      auto_size
      data-testid={"username-input"}
      decorator={<AtIcon />}
      form_slot_props={{
        form_item: {
          className: css["f-grow"]
        }
      }}
      maxLength={USER_PROPS.username.max_length}
      minLength={USER_PROPS.username.min_length}
      name={"username"}
      placeholder={"Enter username"}
      required
    />
  </React.Fragment>
);

const InviteEditor = ({ on_submit }: InviteEditorProps): React.ReactElement => {
  const toast = use_toast();
  const blog = use_blog_context();
  const dispatch = use_app_dispatch();
  const is_smaller_than_desktop = use_media_query(BREAKPOINTS.down("desktop"));
  const is_smaller_than_mobile = use_media_query(BREAKPOINTS.down("mobile"));
  const form = use_form<InviteEditorSchema>({
    resolver: zod_resolver(INVITE_EDITOR_SCHEMA),
    defaultValues: {
      username: ""
    }
  });
  const [invite_editor, { isLoading: is_loading }] =
    use_invite_blog_editor_mutation();

  const handle_submit: SubmitHandler<InviteEditorSchema> = (values) => {
    if (on_submit) {
      on_submit(values);
    } else {
      invite_editor({ ...values, blog_id: blog.id })
        .unwrap()
        .then(() => {
          close_modal();
          form.reset();
          toast("Invite sent", "success");
          dispatch(get_blog_editor_requests_api.util.resetApiState());
        })
        .catch((error) => {
          handle_api_error(error, toast, form, "Could not send the invite");
        });
    }
  };

  const [element, , close_modal] = use_modal(
    ({ open_modal }) =>
      is_smaller_than_desktop ? (
        <IconButton
          aria-label={"Invite editor"}
          auto_size
          check_auth
          data-testid={"invite-editor-button"}
          onClick={open_modal}
          style={{ marginLeft: "-8px" }} // Reduce gap
          variant={"hollow"}
        >
          <PlusIcon />
        </IconButton>
      ) : (
        <Button
          auto_size
          check_auth
          className={clsx(styles.x, styles["header-button"])}
          data-testid={"invite-editor-button"}
          decorator={<PlusIcon />}
          onClick={open_modal}
          variant={"ghost"}
        >
          Invite
        </Button>
      ),
    <Form<InviteEditorSchema>
      className={css["flex-col"]}
      disabled={is_loading}
      on_submit={handle_submit}
      provider_props={form}
    >
      <InviteEditorModal />
    </Form>,
    {
      fullscreen: is_smaller_than_mobile,
      footer: (
        <>
          <ModalFooterButton
            compact={is_smaller_than_mobile}
            disabled={is_loading}
            variant={"ghost"}
          >
            Cancel
          </ModalFooterButton>
          <ModalFooterButton
            compact={is_smaller_than_mobile}
            disabled={!form.formState.isDirty}
            loading={is_loading}
            onClick={(event): void => {
              event.preventDefault(); // Prevent closing of modal
              form.handleSubmit(handle_submit)(); // Submit manually
            }}
          >
            Invite
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
          decorator: <SendIcon />,
          children: "Invite editor"
        }
      }
    }
  );

  return element;
};

export default InviteEditor;
