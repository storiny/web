import clsx from "clsx";
import React from "react";

import Grow from "src/components/grow";
import IconButton from "src/components/icon-button";
import Spacer from "src/components/spacer";
import Textarea from "src/components/textarea";
import EmojiPicker from "src/entities/emoji-picker";
import { insert_text_at_position } from "~/entities/response-textarea/core/utils";
import { use_textarea_autosize } from "src/hooks/use-textarea-autosize";
import AtIcon from "~/icons/At";
import MoodSmileIcon from "~/icons/MoodSmile";
import SendIcon from "~/icons/Send";

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
            "full-w",
            "flex-center",
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
          <EmojiPicker on_emoji_select={insert_emoji}>
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
              <Spacer className={"f-grow"} />
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
