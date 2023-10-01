import { clsx } from "clsx";
import React from "react";

import Button from "~/components/button";
import Form, { SubmitHandler, use_form, zod_resolver } from "~/components/form";
import FormPasswordInput from "~/components/form-password-input";
import { Description, ModalFooterButton, use_modal } from "~/components/modal";
import Spacer from "~/components/spacer";
import { use_toast } from "~/components/toast";
import Typography from "~/components/typography";
import TitleBlock from "~/entities/title-block";
import { use_media_query } from "~/hooks/use-media-query";
import ExportIcon from "~/icons/export";
import PasswordIcon from "~/icons/password";
import { use_export_data_mutation } from "~/redux/features";
import { BREAKPOINTS } from "~/theme/breakpoints";

import DashboardGroup from "../../../../../dashboard-group";
import { ExportDataGroupProps } from "./export-data-group.props";
import {
  ExportDataSchema,
  EXPORT_DATA_SCHEMA
} from "./export-data-group.schema";

const ExportDataModal = (): React.ReactElement => (
  <React.Fragment>
    <Description asChild>
      <Typography className={"t-minor"} level={"body2"}>
        You need to confirm your password to begin the export process. Please be
        aware that the data processing may take up to 14 days, and you will be
        notified by email once it&apos;s ready for download.
      </Typography>
    </Description>
    <Spacer orientation={"vertical"} size={5} />
    <FormPasswordInput
      auto_size
      data-testid={"current-password-input"}
      decorator={<PasswordIcon />}
      form_slot_props={{
        form_item: {
          className: "f-grow"
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

// Export for testing
export const ExportData = ({
  on_submit
}: ExportDataGroupProps): React.ReactElement => {
  const toast = use_toast();
  const is_smaller_than_mobile = use_media_query(BREAKPOINTS.down("mobile"));
  const form = use_form<ExportDataSchema>({
    resolver: zod_resolver(EXPORT_DATA_SCHEMA),
    defaultValues: {
      current_password: ""
    }
  });
  const [export_data, { isLoading: is_loading }] = use_export_data_mutation();

  const handle_submit: SubmitHandler<ExportDataSchema> = (values) => {
    if (on_submit) {
      on_submit(values);
    } else {
      export_data(values)
        .unwrap()
        .then(() => {
          close();
          toast("Data export request sent", "success");
        })
        .catch((e) =>
          toast(
            e?.data?.error || "Could not send your data export request",
            "error"
          )
        );
    }
  };

  const [element, , close] = use_modal(
    ({ open_modal }) => (
      <Button
        auto_size
        check_auth
        className={"fit-w"}
        onClick={open_modal}
        variant={"hollow"}
      >
        Request data
      </Button>
    ),
    <Form<ExportDataSchema>
      className={clsx("flex-col")}
      disabled={is_loading}
      on_submit={handle_submit}
      provider_props={form}
    >
      <ExportDataModal />
    </Form>,
    {
      fullscreen: is_smaller_than_mobile,
      footer: (
        <>
          <ModalFooterButton compact={is_smaller_than_mobile} variant={"ghost"}>
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
          decorator: <ExportIcon />,
          children: "Export your data"
        }
      }
    }
  );

  return element;
};

const ExportDataGroup = (): React.ReactElement => (
  <DashboardGroup>
    <TitleBlock title={"Export your data"}>
      Request a copy of all your data, including your profile information and
      published stories. Processing may take up to 14 days, and you will receive
      an e-mail with a download link. Your exported data will be available for 7
      days after processing is complete.
      <br />
      <br />
      Please note that changing your e-mail during the export process will not
      deliver your data to your new e-mail address.
    </TitleBlock>
    <Spacer orientation={"vertical"} size={4.5} />
    <ExportData />
  </DashboardGroup>
);

export default ExportDataGroup;
