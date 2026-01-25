// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { z } from "zod";

import Form, { use_form } from "~/components/form";

import { zod_resolver } from "../form";
import FormTextarea from "./form-textarea";

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

const meta: Meta<typeof FormTextarea> = {
  title: "components/form-textarea",
  component: FormTextarea,
  decorators: [
    (Story): React.ReactElement => (
      <Component>
        <Story />
      </Component>
    )
  ],
  tags: ["autodocs"],
  args: {
    label: "Textarea label",
    helper_text: "Form textarea helper text",
    size: "md",
    color: "inverted",
    placeholder: "Form textarea placeholder",
    name: "sample",
    form_slot_props: {
      form_item: {
        style: { maxWidth: "300px" }
      }
    }
  }
};

export default meta;
type Story = StoryObj<typeof FormTextarea>;

export const Default: Story = {};
