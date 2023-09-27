import { clsx } from "clsx";
import React from "react";

import Button from "~/components/Button";
import Form, { SubmitHandler, useForm, zodResolver } from "~/components/Form";
import FormPasswordInput from "~/components/FormPasswordInput";
import { Description, ModalFooterButton, useModal } from "~/components/Modal";
import Spacer from "~/components/Spacer";
import { useToast } from "~/components/Toast";
import Typography from "~/components/Typography";
import TitleBlock from "~/entities/TitleBlock";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import ExportIcon from "~/icons/Export";
import PasswordIcon from "~/icons/Password";
import { use_export_data_mutation } from "~/redux/features";
import { breakpoints } from "~/theme/breakpoints";

import DashboardGroup from "../../../../../dashboard-group";
import { ExportDataGroupProps } from "./export-data-group.props";
import { ExportDataSchema, exportDataSchema } from "./export-data-group.schema";

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
      autoSize
      data-testid={"current-password-input"}
      decorator={<PasswordIcon />}
      formSlotProps={{
        formItem: {
          className: "f-grow"
        }
      }}
      label={"Password"}
      name={"current-password"}
      placeholder={"Your password"}
      required
    />
    <Spacer orientation={"vertical"} size={2} />
  </React.Fragment>
);

// Export for testing
export const ExportData = ({
  onSubmit
}: ExportDataGroupProps): React.ReactElement => {
  const toast = useToast();
  const isSmallerThanMobile = useMediaQuery(breakpoints.down("mobile"));
  const form = useForm<ExportDataSchema>({
    resolver: zodResolver(exportDataSchema),
    defaultValues: {
      "current-password": ""
    }
  });
  const [exportData, { isLoading }] = use_export_data_mutation();

  const handleSubmit: SubmitHandler<ExportDataSchema> = (values) => {
    if (onSubmit) {
      onSubmit(values);
    } else {
      exportData(values)
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

  const [element, , close] = useModal(
    ({ openModal }) => (
      <Button
        autoSize
        checkAuth
        className={"fit-w"}
        onClick={openModal}
        variant={"hollow"}
      >
        Request data
      </Button>
    ),
    <Form<ExportDataSchema>
      className={clsx("flex-col")}
      disabled={isLoading}
      onSubmit={handleSubmit}
      providerProps={form}
    >
      <ExportDataModal />
    </Form>,
    {
      fullscreen: isSmallerThanMobile,
      footer: (
        <>
          <ModalFooterButton compact={isSmallerThanMobile} variant={"ghost"}>
            Cancel
          </ModalFooterButton>
          <ModalFooterButton
            compact={isSmallerThanMobile}
            disabled={!form.formState.isDirty}
            loading={isLoading}
            onClick={(event): void => {
              event.preventDefault(); // Prevent closing of modal
              form.handleSubmit(handleSubmit)(); // Submit manually
            }}
          >
            Confirm
          </ModalFooterButton>
        </>
      ),
      slot_props: {
        footer: {
          compact: isSmallerThanMobile
        },
        content: {
          style: {
            width: isSmallerThanMobile ? "100%" : "350px"
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
