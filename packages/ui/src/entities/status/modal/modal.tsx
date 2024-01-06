import { StatusDuration, StatusVisibility, USER_PROPS } from "@storiny/shared";
import { is_num } from "@storiny/shared/src/utils/is-num";
import clsx from "clsx";
import React from "react";

import Divider from "~/components/divider";
import Form, {
  SubmitHandler,
  use_form,
  use_form_context,
  zod_resolver
} from "~/components/form";
import FormInput from "~/components/form-input";
import FormSelect from "~/components/form-select";
import IconButton from "~/components/icon-button";
import { ModalFooterButton, ModalProps, use_modal } from "~/components/modal";
import Option from "~/components/option";
import { use_toast } from "~/components/toast";
import EmojiPicker from "~/entities/emoji-picker";
import {
  SET_STATUS_SCHEMA,
  SetStatusSchema
} from "~/entities/status/modal/schema";
import { use_media_query } from "~/hooks/use-media-query";
import MoodSmileIcon from "~/icons/mood-smile";
import MoodSmile from "~/icons/mood-smile";
import {
  mutate_user,
  select_user,
  use_set_status_mutation
} from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import { BREAKPOINTS } from "~/theme/breakpoints";
import css from "~/theme/main.module.scss";
import { handle_api_error } from "~/utils/handle-api-error";

import status_styles from "../status.module.scss";
import styles from "./modal.module.scss";

const EmojiIconButton = (): React.ReactElement => {
  const form = use_form_context<SetStatusSchema>();
  const emoji = form.watch("status_emoji");
  const has_emoji = Boolean(emoji);

  return (
    <EmojiPicker
      on_emoji_select={(next_emoji): void => {
        form.setValue("status_emoji", next_emoji.unified, {
          shouldDirty: true
        });
      }}
      popover_props={{ modal: true }}
    >
      <IconButton aria-label={"Set status emoji"} title={"Set status emoji"}>
        <span
          className={clsx(
            css["flex-center"],
            status_styles.emoji,
            has_emoji && status_styles["has-emoji"]
          )}
          {...(has_emoji
            ? {
                "aria-label": "Status emoji",
                role: "img",
                style: {
                  "--emoji": `url("${process.env.NEXT_PUBLIC_CDN_URL}/web-assets/raw/emojis/${emoji}.svg")`
                } as React.CSSProperties
              }
            : {
                "aria-hidden": "true"
              })}
        >
          {!has_emoji && <MoodSmile />}
        </span>
      </IconButton>
    </EmojiPicker>
  );
};

const StatusModalContent = (): React.ReactElement => (
  <div className={clsx(css["flex-col"], styles.content)}>
    <FormInput
      autoComplete={"off"}
      auto_size
      end_decorator={<EmojiIconButton />}
      maxLength={USER_PROPS.status.text.max_length}
      name={"status_text"}
      placeholder={"What's happening?"}
    />
    <Divider />
    <div className={clsx(css["flex-center"], styles.row)}>
      <FormSelect
        auto_size
        form_slot_props={{
          form_item: { className: css["f-grow"] }
        }}
        is_numeric_value
        label={"Share with"}
        name={"visibility"}
        slot_props={{
          trigger: {
            "aria-label": "Status visibility"
          },
          value: {
            placeholder: "Visibility"
          },
          content: {
            style: {
              zIndex: "calc(var(--z-index-modal) + 2)"
            }
          }
        }}
      >
        <Option value={String(StatusVisibility.GLOBAL)}>Everyone</Option>
        <Option value={String(StatusVisibility.FOLLOWERS)}>Followers</Option>
        <Option value={String(StatusVisibility.FRIENDS)}>Friends</Option>
      </FormSelect>
      <FormSelect
        auto_size
        form_slot_props={{
          form_item: { className: css["f-grow"] }
        }}
        is_numeric_value
        label={"Clear after"}
        name={"duration"}
        slot_props={{
          trigger: {
            "aria-label": "Clear status after"
          },
          value: {
            placeholder: "Duration"
          },
          content: {
            style: {
              zIndex: "calc(var(--z-index-modal) + 2)"
            }
          }
        }}
      >
        <Option value={String(StatusDuration.DAY_1)}>Today</Option>
        <Option value={String(StatusDuration.HR_4)}>4 hours</Option>
        <Option value={String(StatusDuration.MIN_60)}>1 hour</Option>
        <Option value={String(StatusDuration.MIN_30)}>30 minutes</Option>
        <Option value={String(StatusDuration.NEVER)}>Never</Option>
      </FormSelect>
    </div>
  </div>
);

const StatusModal = ({
  trigger,
  modal_props
}: {
  modal_props?: ModalProps;
  trigger: Parameters<typeof use_modal>[0];
}): React.ReactElement => {
  const toast = use_toast();
  const dispatch = use_app_dispatch();
  const [open, set_open] = React.useState<boolean>(false);
  const is_clear_action_ref = React.useRef<boolean>(false);
  const is_smaller_than_mobile = use_media_query(BREAKPOINTS.down("mobile"));
  const user = use_app_selector(select_user)!;
  const form = use_form<SetStatusSchema>({
    resolver: zod_resolver(SET_STATUS_SCHEMA),
    defaultValues: {
      status_text: user.status?.text ?? undefined,
      status_emoji: user.status?.emoji,
      duration: is_num(user.status?.duration)
        ? user.status!.duration
        : StatusDuration.DAY_1,
      visibility: is_num(user.status?.visibility)
        ? user.status!.visibility
        : StatusVisibility.GLOBAL
    }
  });
  const [set_status, { isLoading: is_loading }] = use_set_status_mutation();

  const handle_submit: SubmitHandler<SetStatusSchema> = (values) => {
    set_status(values)
      .unwrap()
      .then((status) => {
        form.reset(values);
        dispatch(mutate_user({ status }));

        set_open(false);
        toast("Status updated", "success");
      })
      .catch((error) =>
        handle_api_error(error, toast, form, "Could not update your status")
      );
  };

  const clear_status = (): void => {
    set_status(null)
      .unwrap()
      .then(() => {
        form.reset({
          status_text: "",
          status_emoji: null,
          duration: StatusDuration.DAY_1,
          visibility: StatusVisibility.GLOBAL
        });
        set_open(false);
        toast("Status cleared", "success");
      })
      .catch((error) =>
        handle_api_error(error, toast, form, "Could not clear your status")
      );
  };

  const [element] = use_modal(
    trigger,
    <Form<SetStatusSchema>
      className={css["flex-col"]}
      disabled={is_loading}
      on_submit={handle_submit}
      provider_props={form}
    >
      <StatusModalContent />
    </Form>,
    {
      ...modal_props,
      open,
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      onOpenChange: (next_open) => {
        set_open(next_open);
      },
      fullscreen: is_smaller_than_mobile,
      footer: (
        <>
          <ModalFooterButton
            compact={is_smaller_than_mobile}
            disabled={!is_clear_action_ref.current && is_loading}
            loading={is_loading && is_clear_action_ref.current}
            onClick={(event): void => {
              is_clear_action_ref.current = true;
              event.preventDefault(); // Prevent closing of modal
              clear_status();
            }}
            variant={"ghost"}
          >
            Clear
          </ModalFooterButton>
          <ModalFooterButton
            compact={is_smaller_than_mobile}
            disabled={
              (is_clear_action_ref.current && is_loading) ||
              !form.formState.isDirty
            }
            loading={is_loading && !is_clear_action_ref.current}
            onClick={(event): void => {
              is_clear_action_ref.current = false;
              event.preventDefault(); // Prevent closing of modal
              form.handleSubmit(handle_submit)(); // Submit manually
            }}
          >
            Set status
          </ModalFooterButton>
        </>
      ),
      slot_props: {
        footer: {
          compact: is_smaller_than_mobile
        },
        content: {
          style: {
            width: is_smaller_than_mobile ? "100%" : "420px"
          }
        },
        header: {
          decorator: <MoodSmileIcon />,
          children: "Set a status"
        }
      }
    }
  );

  return element;
};

export default StatusModal;
