// noinspection JSUnusedGlobalSymbols

import { zodResolver } from "@hookform/resolvers/zod";
import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { z } from "zod";

import Form, { useForm } from "~/components/Form";
import Option from "~/components/Option";

import FormSelect from "./FormSelect";

const sampleSchema = z.object({
  sample: z.string(),
});

type SampleSchema = z.infer<typeof sampleSchema>;

const Component = ({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement => {
  const form = useForm<SampleSchema>({
    resolver: zodResolver(sampleSchema),
    defaultValues: {
      sample: "option-1",
    },
  });

  return <Form providerProps={form}>{children}</Form>;
};

const meta: Meta<typeof FormSelect> = {
  title: "Components/FormSelect",
  component: FormSelect,
  decorators: [
    (Story): React.ReactElement => (
      <Component>
        <Story />
      </Component>
    ),
  ],
  tags: ["autodocs"],
  args: {
    label: "Select label",
    helperText: "Form select helper text",
    children: [...Array(5)].map((_, index) => (
      <Option key={index} value={`option-${index}`}>
        Option {index + 1}
      </Option>
    )),
    size: "md",
    slotProps: {
      trigger: {
        "aria-label": "Sample select",
      },
    },
    color: "inverted",
    name: "sample",
    style: { maxWidth: "300px" },
  },
};

export default meta;
type Story = StoryObj<typeof FormSelect>;

export const Default: Story = {};
