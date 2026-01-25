import { StoryVisibility } from "@storiny/shared";
import { clsx } from "clsx";
import React from "react";

import FormCheckbox from "~/components/form-checkbox";
import FormRadio from "~/components/form-radio";
import FormRadioGroup from "~/components/form-radio-group";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import css from "~/theme/main.module.scss";

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
      <FormRadio
        aria-label={"Public"}
        label={"Public"}
        value={String(StoryVisibility.PUBLIC)}
      >
        <Typography color={"minor"} level={"body3"}>
          Public stories are visible to everyone and can be featured in home
          feeds, recommended stories, and search results. However, if your
          account is private, your public stories will only be visible to your
          friends and may appear solely in their home feed.
        </Typography>
      </FormRadio>
      <Spacer orientation={"vertical"} />
      <FormRadio
        aria-label={"Unlisted"}
        label={"Unlisted"}
        value={String(StoryVisibility.UNLISTED)}
      >
        <Typography color={"minor"} level={"body3"}>
          Unlisted stories are not displayed in the home feed or search results,
          and can only be accessed via a direct link.
        </Typography>
      </FormRadio>
    </FormRadioGroup>
    <Spacer orientation={"vertical"} size={3} />
    <Typography level={"body2"} weight={"bold"}>
      Miscellaneous
    </Typography>
    <Spacer orientation={"vertical"} size={2} />
    <div className={clsx(css["flex-col"], styles["checkbox-container"])}>
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
