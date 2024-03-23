import { StoryLicense } from "@storiny/shared";
import React from "react";

import { use_form_context } from "~/components/form";
import FormSelect from "~/components/form-select";
import Option from "~/components/option";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";

import { StoryMetadataSchema } from "../../../schema";

const LICENSE_DESCRIPTION_MAP: Record<StoryLicense, React.ReactNode> = {
  [StoryLicense.UNRECOGNIZED /**/]: null,
  [StoryLicense.UNSPECIFIED /* */]: null,
  [StoryLicense.RESERVED /*    */]: (
    <>
      Under the standard reserved license, others are prohibited from copying,
      modifying, or distributing your work, while you retain all the rights to
      your content.
    </>
  ),
  [StoryLicense.CC_ZERO /*     */]: (
    <>
      Under the CC0 license, you waive all copyright and related rights,
      effectively placing your work in the public domain. Others can use,
      modify, and distribute it without any restrictions or attribution
      requirements.
    </>
  ),
  [StoryLicense.CC_BY /*       */]: (
    <>
      Under the CC BY license, you allow others to use, modify, and distribute
      your work for any purpose, even commercially, as long as they provide
      appropriate attribution to you as the original creator.
    </>
  ),
  [StoryLicense.CC_BY_SA /*    */]: (
    <>
      Under the CC BY-SA license, others can use, modify, and distribute your
      work for any purpose, but they must provide attribution and share their
      derivative works under the same CC BY-SA terms.
    </>
  ),
  [StoryLicense.CC_BY_NC /*    */]: (
    <>
      Under the CC BY-NC license, your work can be used, modified, and
      distributed for non-commercial purposes only, as long as proper
      attribution is given to you.
    </>
  ),
  [StoryLicense.CC_BY_ND /*    */]: (
    <>
      Under the CC BY-ND license, others can use your work for any purpose, even
      commercially, but they cannot create derivative works or modifications.
      Attribution is still required.
    </>
  ),
  [StoryLicense.CC_BY_NC_SA /* */]: (
    <>
      Under the CC BY-NC-SA license, you allow others to use, modify, and
      distribute your work for non-commercial purposes, while requiring proper
      attribution and the use of the same license for derivative works.
    </>
  ),
  [StoryLicense.CC_BY_NC_ND /* */]: (
    <>
      Under the CC BY-NC-ND license, others can use and share your work for
      non-commercial purposes, but they cannot create derivative works, and
      attribution to you is mandatory.
    </>
  )
};

const LicenseTab = (): React.ReactElement => {
  const form = use_form_context<StoryMetadataSchema>();
  const license = form.watch("license");
  return (
    <React.Fragment>
      <Typography color={"minor"} level={"body2"}>
        Licensing your story enables you to manage and limit the usage of your
        content by others. Learn more about licensing your story.
      </Typography>
      <Spacer orientation={"vertical"} size={3} />
      <FormSelect
        auto_size
        helper_text={LICENSE_DESCRIPTION_MAP[license]}
        is_numeric_value
        label={"Select a license"}
        name={"license"}
        required
        slot_props={{
          trigger: {
            "aria-label": "Story license"
          },
          value: {
            placeholder: "Story license"
          },
          content: {
            style: {
              zIndex: "calc(var(--z-index-modal) + 2)"
            }
          }
        }}
      >
        <Option value={String(StoryLicense.RESERVED)}>Reserved</Option>
        <Option right_slot={"CC0"} value={String(StoryLicense.CC_ZERO)}>
          Public domain
        </Option>
        <Option right_slot={"CC BY"} value={String(StoryLicense.CC_BY)}>
          Attribution
        </Option>
        <Option right_slot={"CC BY-SA"} value={String(StoryLicense.CC_BY_SA)}>
          Attribution, share alike
        </Option>
        <Option right_slot={"CC BY_ND"} value={String(StoryLicense.CC_BY_ND)}>
          Attribution, no derivatives
        </Option>
        <Option right_slot={"CC BY-NC"} value={String(StoryLicense.CC_BY_NC)}>
          Attribution, non-commercial
        </Option>
        <Option
          right_slot={"CC BY-NC-SA"}
          value={String(StoryLicense.CC_BY_NC_SA)}
        >
          Attribution, non-commercial, share alike
        </Option>
        <Option
          right_slot={"CC BY-NC-ND"}
          value={String(StoryLicense.CC_BY_NC_ND)}
        >
          Attribution, non-commercial, no derivatives
        </Option>
      </FormSelect>
    </React.Fragment>
  );
};

export default LicenseTab;
