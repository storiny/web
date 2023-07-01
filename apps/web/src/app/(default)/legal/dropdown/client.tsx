"use client";

import { clsx } from "clsx";
import { useSelectedLayoutSegments } from "next/navigation";
import { useRouter } from "next/navigation";
import React from "react";

import Option, { OptionProps } from "~/components/Option";
import Select, { SelectGroup, SelectLabel } from "~/components/Select";

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
  const router = useRouter();
  const segments = useSelectedLayoutSegments();
  segments.shift(); // Remove (mdx) layout
  const currentSegment = segments.join("/");

  return (
    <Select
      onValueChange={(value): void => router.push(`/legal/${value}`)}
      size={"lg"}
      slotProps={{
        content: {
          position: "popper",
          style: {
            marginTop: "8px",
            width: "calc(var(--radix-select-trigger-width) - 24px)",
            maxHeight: "calc(var(--radix-popper-available-height) - 24px)"
          }
        },
        trigger: {
          className: clsx("page-header", styles.trigger)
        }
      }}
      value={currentSegment}
    >
      <TermsGroup />
      <PoliciesGroup />
      <AcceptableUsePoliciesGroup />
      <MiscellaneousGroup />
    </Select>
  );
};

export default DropdownClient;
