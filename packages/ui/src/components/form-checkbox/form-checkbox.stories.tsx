// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { z } from "zod";

import Form, { use_form } from "~/components/form";

import { zod_resolver } from "../form";
import FormCheckbox from "./form-checkbox";

const SAMPLE_SCHEMA = z.object({
  sample: z.boolean()
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
      sample: false
    }
  });

  return <Form provider_props={form}>{children}</Form>;
};

const meta: Meta<typeof FormCheckbox> = {
  title: "components/form-checkbox",
  component: FormCheckbox,
  decorators: [
    (Story): React.ReactElement => (
      <Component>
        <Story />
      </Component>
    )
  ],
  tags: ["autodocs"],
  args: {
    size: "md",
    color: "inverted",
    label: "Checkbox label",
    helper_text: "Form checkbox helper text",
    name: "sample",
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    style: { maxWidth: "300px" }
  }
};

export default meta;
type Story = StoryObj<typeof FormCheckbox>;

export const Default: Story = {};
