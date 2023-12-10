import clsx from "clsx";
import React from "react";

import Grow from "~/components/grow";
import IconButton from "~/components/icon-button";
import Spacer from "~/components/spacer";
import Textarea from "~/components/textarea";
import EmojiPicker from "~/entities/emoji-picker";
import { insert_text_at_position } from "~/entities/response-textarea/core/utils";
import { use_textarea_autosize } from "~/hooks/use-textarea-autosize";
import AtIcon from "~/icons/at";
import MoodSmileIcon from "~/icons/mood-smile";
import SendIcon from "~/icons/send";
import css from "~/theme/main.module.scss";

import styles from "./response-textarea.module.scss";
import { ResponseTextareaProps } from "./response-textarea.props";

const ResponseTextarea = React.forwardRef<
  HTMLTextAreaElement,
  ResponseTextareaProps
>((props, ref) => {
  const {
    size,
    hide_post_button,
    post_button_props,
    className,
    disabled,
    ...rest
  } = props;
  const textarea_ref = React.useRef<HTMLTextAreaElement>(null);
  const trigger_resize = use_textarea_autosize(textarea_ref, 280);

  React.useImperativeHandle(ref, () => textarea_ref.current!);

  /**
   * Inserts the `@` symbol
   */
  const insert_mention = (): void => {
    if (textarea_ref.current) {
      insert_text_at_position(textarea_ref.current, "@");
    }
  };

  /**
   * Inserts an emoji
   * @param emoji Eomji to insert
   */
  const insert_emoji = (emoji: string): void => {
    if (textarea_ref.current) {
      insert_text_at_position(textarea_ref.current, emoji);
    }
  };

  return (
    <Textarea
      {...rest}
      className={clsx(styles.textarea, className)}
      disabled={disabled}
      end_decorator={
        <div
          className={clsx(
            css["full-w"],
            css["flex-center"],
            styles.actions,
            disabled && styles.disabled
          )}
          onClick={(): void => {
            if (!disabled) {
              textarea_ref.current?.focus?.();
            }
          }}
        >
          {hide_post_button && <Grow />}
          <EmojiPicker
            on_emoji_select={({ native }): void => insert_emoji(native)}
            popover_props={{ modal: false }}
          >
            <IconButton
              aria-label={"Insert an emoji"}
              auto_size
              disabled={disabled}
              onClick={(event): void => event.stopPropagation()}
              size={size}
              title={"Insert an emoji"}
              variant={"ghost"}
            >
              <MoodSmileIcon />
            </IconButton>
          </EmojiPicker>
          <IconButton
            aria-label={"Mention someone"}
            auto_size
            disabled={disabled}
            onClick={(event): void => {
              event.stopPropagation();
              insert_mention();
            }}
            size={size}
            title={"Mention someone"}
            variant={"ghost"}
          >
            <AtIcon />
          </IconButton>
          {!hide_post_button && (
            <React.Fragment>
              <Spacer className={css["f-grow"]} />
              <IconButton
                {...post_button_props}
                aria-label={"Post response"}
                auto_size
                check_auth
                disabled={disabled}
                onClick={(event): void => {
                  event.stopPropagation();
                  post_button_props?.onClick?.(event);
                }}
                size={size}
                title={"Post response"}
              >
                <SendIcon />
              </IconButton>
            </React.Fragment>
          )}
        </div>
      }
      onChange={(event): void => {
        trigger_resize();
        rest?.onChange?.(event);
      }}
      ref={textarea_ref}
      size={size}
    />
  );
});

ResponseTextarea.displayName = "ResponseTextarea";

export default ResponseTextarea;
