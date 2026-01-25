// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { z } from "zod";

import Form, { use_form } from "~/components/form";

import { zod_resolver } from "../form";
import FormMultiSelect from "./form-multi-select";

const SAMPLE_SCHEMA = z.object({
  sample: z.array(z.string())
});

type SampleSchema = z.infer<typeof SAMPLE_SCHEMA>;

const Component = ({
  children
}: {
  children: React.ReactNode;
}): React.ReactElement => {
  const form = use_form<SampleSchema>({
    resolver: zod_resolver(SAMPLE_SCHEMA),
    defaultValues: {
      sample: ["option-1"]
    }
  });

  return <Form provider_props={form}>{children}</Form>;
};

const meta: Meta<typeof FormMultiSelect> = {
  title: "components/form-multi-select",
  component: FormMultiSelect,
  decorators: [
    (Story): React.ReactElement => (
      <Component>
        <Story />
      </Component>
    )
  ],
  tags: ["autodocs"],
  args: {
    label: "Multi select label",
    helper_text: "Form multi-select helper text",
    options: [
      { value: "option-1", label: "Option 1" },
      { value: "option-2", label: "Option 2" },
      { value: "option-3", label: "Option 3" }
    ],
    size: "md",
    color: "inverted",
    name: "sample",

    style: { maxWidth: "300px" }
  }
};

export default meta;
type Story = StoryObj<typeof FormMultiSelect>;

export const Default: Story = {};
