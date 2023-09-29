// noinspection JSUnusedGlobalSymbols

import { zod_resolver } from "../form";
import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { z } from "zod";

import Form, { use_form } from "~/components/form";

import FormSwitch from "./form-switch";

const sample_schema = z.object({
  sample: z.boolean()
});

type SampleSchema = z.infer<typeof sample_schema>;

const Component = ({
  children
}: {
  children: React.ReactNode;
}): React.ReactElement => {
  const form = use_form<SampleSchema>({
    resolver: zod_resolver(sample_schema),
    defaultValues: {
      sample: false
    }
  });

  return <Form provider_props={form}>{children}</Form>;
};

const meta: Meta<typeof FormSwitch> = {
  title: "components/form-switch",
  component: FormSwitch,
  decorators: [
    (Story): React.ReactElement => (
      <Component>
        <Story />
      </Component>
    )
  ],
  tags: ["autodocs"],
  args: {
    label: "Switch label",
    helper_text: "Form switch helper text",
    "aria-label": "Sample switch",
    size: "md",
    color: "inverted",
    name: "sample",
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    style: { maxWidth: "300px" }
  }
};

export default meta;
type Story = StoryObj<typeof FormSwitch>;

export const Default: Story = {};
