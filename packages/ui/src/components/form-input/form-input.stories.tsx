// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { z } from "zod";

import Form, { use_form } from "~/components/form";

import { zod_resolver } from "../form";
import FormInput from "./form-input";

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
      sample: ""
    }
  });

  return <Form provider_props={form}>{children}</Form>;
};

const meta: Meta<typeof FormInput> = {
  title: "components/form-input",
  component: FormInput,
  decorators: [
    (Story): React.ReactElement => (
      <Component>
        <Story />
      </Component>
    )
  ],
  tags: ["autodocs"],
  args: {
    label: "Input label",
    helper_text: "Form input helper text",
    size: "md",
    color: "inverted",
    type: "text",
    placeholder: "Form input placeholder",
    name: "sample",
    form_slot_props: {
      form_item: {
        style: { maxWidth: "300px" }
      }
    }
  }
};

export default meta;
type Story = StoryObj<typeof FormInput>;

export const Default: Story = {};
