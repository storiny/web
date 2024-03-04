"use client";

import { clsx } from "clsx";
import NextLink from "next/link";
import React from "react";
import { ErrorCode, useDropzone as use_dropzone } from "react-dropzone";

import { use_blog_context } from "~/common/context/blog";
import Button from "~/components/button";
import Divider from "~/components/divider";
import IconButton from "~/components/icon-button";
import Link from "~/components/link";
import Spacer from "~/components/spacer";
import Spinner from "~/components/spinner";
import { use_toast } from "~/components/toast";
import Typography from "~/components/typography";
import { PlusBadge } from "~/entities/badges";
import TitleBlock from "~/entities/title-block";
import FileUploadIcon from "~/icons/file-upload";
import TrashIcon from "~/icons/trash";
import {
  use_delete_blog_font_mutation,
  use_upload_blog_font_mutation
} from "~/redux/features";
import css from "~/theme/main.module.scss";
import { capitalize } from "~/utils/capitalize";
import { handle_api_error } from "~/utils/handle-api-error";

import DashboardGroup from "../../../../../../common/dashboard-group";
import styles from "./fonts.module.scss";

// Max font file size
const THREE_MB_IN_BYTES = 3_145_728;

const FontItem = ({
  type
}: {
  type: "primary" | "secondary" | "code";
}): React.ReactElement => {
  const toast = use_toast();
  const blog = use_blog_context();
  const [font, set_font] = React.useState<string | null>(blog[`font_${type}`]);
  const [upload_font, { isLoading: is_upload_loading }] =
    use_upload_blog_font_mutation();
  const [delete_font, { isLoading: is_delete_loading }] =
    use_delete_blog_font_mutation();
  const {
    getRootProps: get_root_props,
    getInputProps: get_input_props,
    isDragActive: is_drag_active
  } = use_dropzone({
    /* eslint-disable prefer-snakecase/prefer-snakecase */
    maxFiles: 1,
    maxSize: THREE_MB_IN_BYTES,
    multiple: false,
    autoFocus: false,
    disabled: is_upload_loading || is_delete_loading,
    accept: {
      "font/woff2": []
    },
    onError: () => toast("Unable to import the font file", "error"),
    /* eslint-enable prefer-snakecase/prefer-snakecase */
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    onDrop: (accepted_files, file_rejections) => {
      if (file_rejections.length) {
        let error_message = "";

        for (const rejection of file_rejections) {
          for (const error of rejection.errors) {
            switch (error.code) {
              case ErrorCode.FileInvalidType:
                error_message = "Unsupported font file";
                break;
              case ErrorCode.FileTooLarge:
                error_message = "Font file is too large";
                break;
              case ErrorCode.TooManyFiles:
                error_message =
                  "Only a single font file can be uploaded at a time";
                break;
              default:
                error_message = "Unable to import the font file";
            }
          }
        }

        toast(error_message, "error");
      } else {
        const accepted_file = accepted_files[0] as File;

        if (accepted_file) {
          handle_upload(accepted_file);
        } else {
          toast("No file selected", "error");
        }
      }
    }
  });

  /**
   * Handles the uploading of the font
   */
  const handle_upload = React.useCallback(
    (file: File) => {
      if (file) {
        upload_font({ file, type, blog_id: blog.id })
          .unwrap()
          .then((uploaded) => {
            set_font(uploaded.id);
            blog.mutate({ [`font_${type}`]: uploaded.id });
            toast("Font updated successfully", "success");
          })
          .catch((error) =>
            handle_api_error(error, toast, null, "Could not upload the font")
          );
      }
    },
    [blog, toast, type, upload_font]
  );

  /**
   * Resets the font
   */
  const reset_font = React.useCallback(() => {
    delete_font({
      type,
      blog_id: blog.id
    })
      .unwrap()
      .then(() => {
        blog.mutate({ [`font_${type}`]: null });
        toast("Font removed successfully", "success");
      })
      .catch((error) =>
        handle_api_error(error, toast, null, "Could not remove the font")
      );
  }, [blog, delete_font, toast, type]);

  return (
    <React.Fragment>
      {font && (
        // eslint-disable-next-line react/no-unknown-property
        <style global jsx>{`
          @font-face {
            font-family: blog-font-preview-${type};
            font-weight: normal;
            font-style: normal;
            src: url("https://cdn.storiny.com/user-assets/fonts/${font}.woff2")
              format("woff2");
          }
        `}</style>
      )}
      <div className={clsx(css["flex-center"], css["flex-col"], styles.item)}>
        <div
          {...get_root_props({
            className: clsx(
              css["flex-center"],
              css["focusable"],
              styles["drop-zone"],
              (is_upload_loading || is_delete_loading) && styles.disabled,
              is_drag_active && styles.active
            )
          })}
        >
          <input {...get_input_props()} />
          {is_upload_loading || is_delete_loading ? (
            <Spinner />
          ) : font ? (
            <span
              aria-hidden={"true"}
              className={styles.preview}
              style={{
                fontFamily: `blog-font-preview-${type}, var(--font-system)`
              }}
            >
              Ag
            </span>
          ) : (
            <FileUploadIcon />
          )}
        </div>
        <div className={clsx(css["flex-center"], styles.footer)}>
          <Typography color={"minor"} level={"body3"}>
            {is_drag_active ? "Drop it!" : `${capitalize(type)} font`}
          </Typography>
          {font && (
            <React.Fragment>
              <Divider orientation={"vertical"} />
              <IconButton
                aria-label={"Remove font"}
                disabled={is_upload_loading || is_delete_loading}
                onClick={(): void => {
                  set_font(null);
                  reset_font();
                }}
                size={"xs"}
                title={"Remove font"}
                variant={"ghost"}
              >
                <TrashIcon />
              </IconButton>
            </React.Fragment>
          )}
        </div>
      </div>
    </React.Fragment>
  );
};

const BlogFontsSettings = (): React.ReactElement => {
  const blog = use_blog_context();
  return (
    <DashboardGroup>
      <TitleBlock title={"Fonts"}>
        You can upload your own fonts to use for your blog. These will override
        Storiny&apos;s default fonts.
        <br />
        <br />
        The primary font is used for headings, the secondary font is used for
        body text, and the code font is used for inline code snippets and code
        blocks. We recommend using a display font as the primary font, a serif
        or sans-serif font as the secondary font, and a monospace font as the
        code font choice.
        <br />
        <br />
        Please upload the fonts in <span className={css["t-bold"]}>
          WOFF2
        </span>{" "}
        format. We recommend using a variable font for the primary and secondary
        typefaces.{" "}
        <Link
          href={"https://fonts.google.com/knowledge/glossary/variable_fonts"}
          target={"_blank"}
          underline={"always"}
        >
          Learn more about variable fonts
        </Link>
        .
      </TitleBlock>
      <Spacer orientation={"vertical"} size={3} />
      <div className={clsx(css.flex, styles.content)}>
        {blog.has_plus_features ? (
          (["primary", "secondary", "code"] as const).map((font) => (
            <FontItem key={font} type={font} />
          ))
        ) : (
          <Button
            as={NextLink}
            auto_size
            className={css["fit-w"]}
            decorator={<PlusBadge no_stroke />}
            href={"/membership"}
            target={"_blank"}
            variant={"hollow"}
          >
            This is a plus feature
          </Button>
        )}
      </div>
    </DashboardGroup>
  );
};

export default BlogFontsSettings;
