import { USER_PROPS } from "@storiny/shared";
import { ParseResult } from "papaparse";
import React from "react";
import { ErrorCode, useDropzone as use_dropzone } from "react-dropzone";
import { z } from "zod";

import { use_blog_context } from "~/common/context/blog";
import { use_app_router } from "~/common/utils";
import Button from "~/components/button";
import Link from "~/components/link";
import Spacer from "~/components/spacer";
import { use_toast } from "~/components/toast";
import TitleBlock from "~/entities/title-block";
import UploadIcon from "~/icons/upload";
import { use_import_subscribers_mutation } from "~/redux/features";
import css from "~/theme/main.module.scss";
import { handle_api_error } from "~/utils/handle-api-error";

import DashboardGroup from "../../../../../common/dashboard-group";

// Max csv file size
const TEN_MB_IN_BYTES = 10_485_760;
// Max entries in the CSV file
const MAX_ENTRIES = 20_000;
// Email validation schema
const EMAIL_SCHEMA = z
  .string()
  .min(USER_PROPS.email.min_length)
  .max(USER_PROPS.email.max_length)
  .email();

const ImportSubscribers = (): React.ReactElement => {
  const router = use_app_router();
  const toast = use_toast();
  const blog = use_blog_context();
  const [loading, set_loading] = React.useState<boolean>(false);
  const [import_subscribers, { isLoading: is_loading }] =
    use_import_subscribers_mutation();
  const {
    getRootProps: get_root_props,
    getInputProps: get_input_props,
    open
  } = use_dropzone({
    maxFiles: 1,
    maxSize: TEN_MB_IN_BYTES,
    multiple: false,
    autoFocus: false,
    noClick: true,
    noKeyboard: true,
    disabled: is_loading,
    accept: {
      "text/csv": []
    },
    onError: () => toast("Unable to import the CSV file", "error"),

    onDrop: (accepted_files, file_rejections) => {
      if (file_rejections.length) {
        let error_message = "";

        for (const rejection of file_rejections) {
          for (const error of rejection.errors) {
            switch (error.code) {
              case ErrorCode.FileInvalidType:
                error_message = "Unsupported CSV file";
                break;
              case ErrorCode.FileTooLarge:
                error_message = "CSV file is too large";
                break;
              case ErrorCode.TooManyFiles:
                error_message =
                  "Only a single CSV file can be uploaded at a time";
                break;
              default:
                error_message = "Unable to import the CSV file";
            }
          }
        }

        toast(error_message, "error");
      } else {
        const accepted_file = accepted_files[0] as File;

        if (accepted_file) {
          handle_upload(accepted_file).then(() => undefined);
        } else {
          toast("No file selected", "error");
        }
      }
    }
  });

  /**
   * Handles the CSV file from the client.
   */
  const handle_upload = React.useCallback(
    async (file: File) => {
      if (file) {
        try {
          set_loading(true);

          const { parse } = await import("papaparse");
          const results = await new Promise<string[]>((resolve, reject) => {
            parse(file, {
              worker: true,
              skipEmptyLines: true,
              error: (error: Error) => reject(error),
              complete: (results: ParseResult<string>): void => {
                if (results.errors.length) {
                  reject(results.errors);
                } else {
                  const data = (results.data || []).flat().filter(Boolean);
                  const unique = [...new Set(data)].filter(
                    (item) => EMAIL_SCHEMA.safeParse(item).success
                  );

                  resolve(unique);
                }
              }
            });
          });

          if (!results.length) {
            return toast(
              "No valid entries were found in the CSV file",
              "error"
            );
          }

          if (results.length > MAX_ENTRIES) {
            return toast("CSV file contains too many entries", "error");
          }

          try {
            await import_subscribers({
              blog_id: blog.id,
              data: results
            }).unwrap();

            toast("Subscribers imported successfully, refreshing…", "success");

            // Wait 2 seconds for the toast message.
            setTimeout(() => router.refresh(), 2000);
          } catch (error) {
            handle_api_error(
              error,
              toast,
              null,
              "Could not import the subscribers"
            );
          }
        } catch {
          toast("CSV file contains invalid data", "error");
        } finally {
          set_loading(false);
        }
      }
    },
    [toast, import_subscribers, blog.id, router]
  );

  return (
    <DashboardGroup>
      <TitleBlock title={"Import subscribers"}>
        Bring in a list of subscribers gathered from other sources. You may only
        do so after consenting to adhere to our{" "}
        <Link href={"/terms"} target={"_blank"}>
          Terms of Use
        </Link>
        , which include important rules for how you use the import tool.
        <br />
        <br />
        We only accept CSV files that are under 10MB and contain a maximum of
        20,000 entries. The file should have a single column with email
        addresses. Please keep in mind that you can only import external
        subscribers once per week.
      </TitleBlock>
      <Spacer orientation={"vertical"} size={4} />
      <div {...get_root_props()}>
        <input {...get_input_props()} />
        <Button
          auto_size
          check_auth
          className={css["fit-w"]}
          decorator={<UploadIcon />}
          loading={loading || is_loading}
          onClick={open}
          variant={"hollow"}
        >
          Import
        </Button>
      </div>
    </DashboardGroup>
  );
};

export default ImportSubscribers;
