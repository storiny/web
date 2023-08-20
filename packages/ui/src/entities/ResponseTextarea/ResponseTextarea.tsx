import clsx from "clsx";
import React from "react";

import Grow from "~/components/Grow";
import IconButton from "~/components/IconButton";
import Spacer from "~/components/Spacer";
import Textarea from "~/components/Textarea";
import EmojiPicker from "~/entities/EmojiPicker";
import { insertTextAtPosition } from "~/entities/ResponseTextarea/core/utils";
import { useTextareaAutosize } from "~/hooks/useTextareaAutosize";
import AtIcon from "~/icons/At";
import MoodSmileIcon from "~/icons/MoodSmile";
import SendIcon from "~/icons/Send";

import styles from "./ResponseTextarea.module.scss";
import { ResponseTextareaProps } from "./ResponseTextarea.props";

const ResponseTextarea = React.forwardRef<
  HTMLTextAreaElement,
  ResponseTextareaProps
>((props, ref) => {
  const { hidePostButton, postButtonProps, className, disabled, ...rest } =
    props;
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const triggerResize = useTextareaAutosize(textareaRef, 280);

  React.useImperativeHandle(ref, () => textareaRef.current!);

  /**
   * Inserts the `@` symbol
   */
  const insertMention = (): void => {
    if (textareaRef.current) {
      insertTextAtPosition(textareaRef.current, "@");
    }
  };

  /**
   * Inserts an emoji
   * @param emoji Eomji to insert
   */
  const insertEmoji = (emoji: string): void => {
    if (textareaRef.current) {
      insertTextAtPosition(textareaRef.current, emoji);
    }
  };

  return (
    <Textarea
      {...rest}
      className={clsx(styles.textarea, className)}
      disabled={disabled}
      endDecorator={
        <div className={clsx("full-w", "flex-center", styles.actions)}>
          {hidePostButton && <Grow />}
          <EmojiPicker onEmojiSelect={insertEmoji}>
            <IconButton
              aria-label={"Insert an emoji"}
              autoSize
              disabled={disabled}
              title={"Insert an emoji"}
              variant={"ghost"}
            >
              <MoodSmileIcon />
            </IconButton>
          </EmojiPicker>
          <IconButton
            aria-label={"Mention someone"}
            autoSize
            disabled={disabled}
            onClick={insertMention}
            title={"Mention someone"}
            variant={"ghost"}
          >
            <AtIcon />
          </IconButton>
          {!hidePostButton && (
            <React.Fragment>
              <Spacer className={"f-grow"} />
              <IconButton
                {...postButtonProps}
                aria-label={"Post response"}
                autoSize
                checkAuth
                disabled={disabled}
                title={"Post response"}
              >
                <SendIcon />
              </IconButton>
            </React.Fragment>
          )}
        </div>
      }
      onChange={(event): void => {
        triggerResize();
        rest?.onChange?.(event);
      }}
      ref={textareaRef}
    />
  );
});

ResponseTextarea.displayName = "ResponseTextarea";

export default ResponseTextarea;
