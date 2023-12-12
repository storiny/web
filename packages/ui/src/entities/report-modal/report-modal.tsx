"use client";

import { clsx } from "clsx";
import React from "react";

import Form, { SubmitHandler, use_form, zod_resolver } from "~/components/form";
import FormRadio from "~/components/form-radio";
import FormRadioGroup from "~/components/form-radio-group";
import FormTextarea from "~/components/form-textarea";
import { ModalFooterButton, use_modal } from "~/components/modal";
import ScrollArea from "~/components/scroll-area";
import Spacer from "~/components/spacer";
import { use_toast } from "~/components/toast";
import Typography from "~/components/typography";
import { use_media_query } from "~/hooks/use-media-query";
import ReportIcon from "~/icons/report";
import ShieldCheckIcon from "~/icons/shield-check";
import { use_report_entity_mutation } from "~/redux/features";
import { BREAKPOINTS } from "~/theme/breakpoints";
import css from "~/theme/main.module.scss";
import { handle_api_error } from "~/utils/handle-api-error";

import styles from "./report-modal.module.scss";
import { ReportModalProps } from "./report-modal.props";
import {
  REPORT_REASON_MAX_LENGTH,
  REPORT_SCHEMA,
  ReportSchema
} from "./schema";

const ReportModal = (props: ReportModalProps): React.ReactElement => {
  const { trigger, entity_type, entity_id } = props;
  const toast = use_toast();
  const is_smaller_than_mobile = use_media_query(BREAKPOINTS.down("mobile"));
  const form = use_form<ReportSchema>({
    resolver: zod_resolver(REPORT_SCHEMA),
    defaultValues: {
      reason: "",
      type: ""
    }
  });
  const [report_entity, { isLoading: is_loading, isSuccess: is_success }] =
    use_report_entity_mutation();
  const report_type = form.watch("type");

  const handle_submit: SubmitHandler<ReportSchema> = (values) => {
    report_entity({ ...values, entity_id })
      .unwrap()
      .then(() => {
        form.reset();
      })
      .catch((error) =>
        handle_api_error(
          error,
          toast,
          form,
          `Could not report the ${entity_type}`
        )
      );
  };

  const [element] = use_modal(
    trigger,
    <ScrollArea
      className={clsx(styles.x, styles["scroll-area"])}
      slot_props={{
        viewport: { className: clsx(styles.x, styles.viewport) }
      }}
    >
      {is_success ? (
        <>
          <div className={clsx(css["flex-center"], styles["icon-wrapper"])}>
            <ShieldCheckIcon />
          </div>
          <Typography
            className={css["t-center"]}
            color={"minor"}
            level={"body2"}
          >
            Your report has been received.
          </Typography>
        </>
      ) : (
        <Form<ReportSchema>
          className={clsx(css["flex-col"], css["full-h"])}
          disabled={is_loading}
          on_submit={handle_submit}
          provider_props={form}
        >
          <FormRadioGroup
            auto_size
            className={clsx(styles.x, styles["radio-group"])}
            form_slot_props={{
              control: {
                style: {
                  // eslint-disable-next-line prefer-snakecase/prefer-snakecase
                  paddingBlock: "12px"
                }
              }
            }}
            label={`Why are you reporting this ${entity_type}?`}
            name={"type"}
          >
            <FormRadio aria-label={"Spam"} label={"Spam"} value={"spam"} />
            <FormRadio
              aria-label={"Contains or depicts nudity"}
              label={"Contains or depicts nudity"}
              value={"nudity"}
            />
            <FormRadio
              aria-label={"Hate speech or discrimination"}
              label={"Hate speech or discrimination"}
              value={"hate_speech_discrimination"}
            />
            <FormRadio
              aria-label={"Harassment or bullying"}
              label={"Harassment or bullying"}
              value={"harassment_bullying"}
            />
            <FormRadio
              aria-label={"Violence or threats"}
              label={"Violence or threats"}
              value={"violence_threats"}
            />
            <FormRadio
              aria-label={"Self-harm or suicide"}
              label={"Self-harm or suicide"}
              value={"selfharm_suicide"}
            />
            <FormRadio
              aria-label={"Misinformation"}
              label={"Misinformation"}
              value={"misinformation"}
            />
            <FormRadio
              aria-label={"Copyright infringement"}
              label={"Copyright infringement"}
              value={"copyright_infringement"}
            />
            <FormRadio
              aria-label={"Impersonation"}
              label={"Impersonation"}
              value={"impersonation"}
            />
            <FormRadio
              aria-label={"Privacy violation"}
              label={"Privacy violation"}
              value={"privacy_violation"}
            />
            <FormRadio aria-label={"Other"} label={"Other"} value={"other"} />
          </FormRadioGroup>
          <Spacer orientation={"vertical"} size={3} />
          <FormTextarea
            label={"Issue description"}
            maxLength={REPORT_REASON_MAX_LENGTH}
            name={"reason"}
            placeholder={"Describe the problem you are facing"}
          />
        </Form>
      )}
    </ScrollArea>,
    {
      fullscreen: is_smaller_than_mobile,
      footer: (
        <>
          {!is_success && (
            <ModalFooterButton
              compact={is_smaller_than_mobile}
              disabled={is_loading}
              variant={"ghost"}
            >
              Cancel
            </ModalFooterButton>
          )}
          <ModalFooterButton
            color={is_success ? "inverted" : "ruby"}
            compact={is_smaller_than_mobile}
            disabled={!is_success && !report_type}
            loading={is_loading}
            onClick={(event): void => {
              if (!is_success) {
                event.preventDefault(); // Prevent closing of modal
                form.handleSubmit(handle_submit)();
              }
            }}
          >
            {is_success ? "Done" : "Report"}
          </ModalFooterButton>
        </>
      ),
      slot_props: {
        footer: { compact: is_smaller_than_mobile },
        content: {
          style: {
            width: is_smaller_than_mobile
              ? "100%"
              : is_success
              ? "340px"
              : "420px"
          }
        },
        body: {
          className: clsx(styles.x, styles.body, is_success && styles.posted)
        },
        header: {
          decorator: <ReportIcon />,
          children: `Report ${entity_type}`
        }
      }
    }
  );

  return element;
};

export default ReportModal;
