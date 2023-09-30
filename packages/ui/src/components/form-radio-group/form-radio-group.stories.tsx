// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { z } from "zod";

import Form, { use_form } from "~/components/form";
import FormRadio from "~/components/form-radio";

import { zod_resolver } from "../form";
import FormRadioGroup from "./form-radio-group";

const sample_schema = z.object({
  sample: z.enum(["1", "2", "3"])
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
      sample: "1"
    }
  });

  return <Form provider_props={form}>{children}</Form>;
};

const meta: Meta<typeof FormRadioGroup> = {
  title: "components/form-radio-group",
  component: FormRadioGroup,
  decorators: [
    (Story): React.ReactElement => (
      <Component>
        <Story />
      </Component>
    )
  ],
  tags: ["autodocs"],
  args: {
    label: "Radio group label",
    helper_text: "Form radio group helper text",
    children: [...Array(3)].map((_, index) => (
      <FormRadio
        aria-label={"Sample radio"}
        key={index}
        label={"Radio label"}
        value={String(index)}
      />
    )),
    defaultValue: "1",
    size: "md",
    color: "inverted",
    name: "sample",
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    style: { maxWidth: "300px" }
  }
};

export default meta;
type Story = StoryObj<typeof FormRadioGroup>;

export const Default: Story = {};
