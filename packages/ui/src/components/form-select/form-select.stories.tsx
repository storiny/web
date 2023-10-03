// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { z } from "zod";

import Form, { use_form } from "~/components/form";
import Option from "~/components/option";

import { zod_resolver } from "../form";
import FormSelect from "./form-select";

const SAMPLE_SCHEMA = z.object({
  sample: z.string()
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
      sample: "option-1"
    }
  });

  return <Form provider_props={form}>{children}</Form>;
};

const meta: Meta<typeof FormSelect> = {
  title: "components/form-select",
  component: FormSelect,
  decorators: [
    (Story): React.ReactElement => (
      <Component>
        <Story />
      </Component>
    )
  ],
  tags: ["autodocs"],
  args: {
    label: "Select label",
    helper_text: "Form select helper text",
    children: [...Array(5)].map((_, index) => (
      <Option key={index} value={`option-${index}`}>
        Option {index + 1}
      </Option>
    )),
    size: "md",
    slot_props: {
      trigger: {
        "aria-label": "Sample select"
      }
    },
    color: "inverted",
    name: "sample",
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    style: { maxWidth: "300px" }
  }
};

export default meta;
type Story = StoryObj<typeof FormSelect>;

export const Default: Story = {};
