import { clsx } from "clsx";
import React from "react";

import FormCheckbox from "../../../../../../../ui/src/components/form-checkbox";
import FormRadio from "../../../../../../../ui/src/components/form-radio";
import FormRadioGroup from "../../../../../../../ui/src/components/form-radio-group";
import Spacer from "../../../../../../../ui/src/components/spacer";
import Typography from "../../../../../../../ui/src/components/typography";

import styles from "./settings.module.scss";

const SettingsTab = (): React.ReactElement => (
  <React.Fragment>
    <FormRadioGroup
      auto_size
      form_slot_props={{
        form_item: {
          style: {
            gap: "16px"
          }
        }
      }}
      is_numeric_value
      label={"Visibility"}
      name={"visibility"}
    >
      <FormRadio aria-label={"Public"} label={"Public"} value={"1"}>
        <Typography className={"t-minor"} level={"body3"}>
          Public stories are visible to everyone and can be featured in home
          feeds, recommended stories, and search results. However, if your
          account is private, your public stories will only be visible to your
          friends and may appear solely in their home feed.
        </Typography>
      </FormRadio>
      <Spacer orientation={"vertical"} />
      <FormRadio aria-label={"Unlisted"} label={"Unlisted"} value={"0"}>
        <Typography className={"t-minor"} level={"body3"}>
          Unlisted stories are not displayed in the home feed or search results,
          and can only be accessed via a direct link.
        </Typography>
      </FormRadio>
    </FormRadioGroup>
    <Spacer orientation={"vertical"} size={3} />
    <Typography className={"t-bold"} level={"body2"}>
      Miscellaneous
    </Typography>
    <Spacer orientation={"vertical"} size={2} />
    <div className={clsx("flex-col", styles["checkbox-container"])}>
      <FormCheckbox
        inverted
        label={"Show table of contents for this story"}
        name={"disable_toc"}
      />
      <FormCheckbox
        inverted
        label={"Allow everyone to comment on this story"}
        name={"disable_comments"}
      />
      <FormCheckbox
        form_slot_props={{
          form_item: {
            style: {
              gap: "4px"
            }
          },
          helper_text: {
            style: {
              // eslint-disable-next-line prefer-snakecase/prefer-snakecase
              paddingLeft: "24px"
            }
          }
        }}
        helper_text={
          <>
            When you edit a story you have already published, a new version is
            created. You can decide if you want people to see the old versions
            before the most recent edit. This does not include the versions that
            were saved automatically.
          </>
        }
        inverted
        label={"Allow everyone to read the past versions of this story"}
        name={"disable_public_revision_history"}
      />
    </div>
  </React.Fragment>
);

export default SettingsTab;
