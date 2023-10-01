"use client";

import { clsx } from "clsx";
import { useSelectedLayoutSegments as use_selected_layout_segments } from "next/navigation";
import { useRouter as use_router } from "next/navigation";
import React from "react";

import Option, { OptionProps } from "~/components/option";
import Select, { SelectGroup, SelectLabel } from "~/components/select";

import { LegalSegment } from "../types";
import styles from "./dropdown.module.scss";

const AnchorOption = ({
  children,
  value,
  ...rest
}: Omit<OptionProps, "value"> & {
  value: LegalSegment;
}): React.ReactElement => (
  <Option {...rest} value={value}>
    {children}
  </Option>
);

// Terms group

const TermsGroup = (): React.ReactElement => (
  <SelectGroup>
    <SelectLabel>Storiny Terms</SelectLabel>
    <AnchorOption value={"terms/tos"}>Terms of Service</AnchorOption>
    <AnchorOption value={"terms/community-guidelines"}>
      Community Guidelines
    </AnchorOption>
  </SelectGroup>
);

// Policies group

const PoliciesGroup = (): React.ReactElement => (
  <SelectGroup>
    <SelectLabel>Storiny Policies</SelectLabel>
    <AnchorOption value={"policies/privacy"}>Privacy Policy</AnchorOption>
    <AnchorOption value={"policies/username"}>Username Policy</AnchorOption>
    <AnchorOption value={"policies/logo"}>Logo Policy</AnchorOption>
    <AnchorOption value={"policies/trademark"}>Trademark Policy</AnchorOption>
    <AnchorOption value={"policies/government-takedown"}>
      Government Takedown Policy
    </AnchorOption>
    <AnchorOption value={"policies/dmca"}>DMCA Takedown Policy</AnchorOption>
    <AnchorOption value={"policies/content-removal"}>
      Content Removal Policy
    </AnchorOption>
  </SelectGroup>
);

// Acceptable use policies group

const AcceptableUsePoliciesGroup = (): React.ReactElement => (
  <SelectGroup>
    <SelectLabel>Storiny Terms</SelectLabel>
    <AnchorOption value={"use-policies/general"}>General</AnchorOption>
    <AnchorOption value={"use-policies/bullying"}>
      Bullying and Harassment
    </AnchorOption>
    <AnchorOption value={"use-policies/disturbing-ux"}>
      Disturbing User Experience
    </AnchorOption>
    <AnchorOption value={"use-policies/doxxing"}>
      Doxxing and Invasion of Privacy
    </AnchorOption>
    <AnchorOption value={"use-policies/hate-speech"}>
      Hate Speech and Discrimination
    </AnchorOption>
    <AnchorOption value={"use-policies/impersonation"}>
      Impersonation
    </AnchorOption>
    <AnchorOption value={"use-policies/misinformation"}>
      Misinformation
    </AnchorOption>
    <AnchorOption value={"use-policies/obscene-content"}>
      Sexually Obscene Content
    </AnchorOption>
    <AnchorOption value={"use-policies/violent-content"}>
      Violent Threats and Content
    </AnchorOption>
    <AnchorOption value={"use-policies/appeal-and-reinstatement"}>
      Appeal and Reinstatement
    </AnchorOption>
  </SelectGroup>
);

// Miscellaneous group

const MiscellaneousGroup = (): React.ReactElement => (
  <SelectGroup>
    <SelectLabel>Miscellaneous</SelectLabel>
    <AnchorOption value={"miscellaneous/acknowledgements"}>
      Acknowledgements
    </AnchorOption>
  </SelectGroup>
);

const DropdownClient = (): React.ReactElement => {
  const router = use_router();
  const segments = use_selected_layout_segments();
  segments.shift(); // Remove (mdx) layout
  const current_segment = segments.join("/");

  return (
    <Select
      onValueChange={(value): void => router.push(`/legal/${value}`)}
      size={"lg"}
      slot_props={{
        content: {
          position: "popper",
          style: {
            // eslint-disable-next-line prefer-snakecase/prefer-snakecase
            marginTop: "8px",
            width: "calc(var(--radix-select-trigger-width) - 24px)",
            // eslint-disable-next-line prefer-snakecase/prefer-snakecase
            maxHeight: "calc(var(--radix-popper-available-height) - 24px)"
          }
        },
        trigger: {
          className: clsx("full-bleed", "page-header", styles.x, styles.trigger)
        }
      }}
      value={current_segment}
    >
      <TermsGroup />
      <PoliciesGroup />
      <AcceptableUsePoliciesGroup />
      <MiscellaneousGroup />
    </Select>
  );
};

export default DropdownClient;
