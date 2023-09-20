// noinspection JSUnusedGlobalSymbols

import { zodResolver } from "@hookform/resolvers/zod";
import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { z } from "zod";

import Form, { useForm } from "~/components/Form";

import FormMultiSelect from "./form-multi-select";

const sampleSchema = z.object({
  sample: z.array(z.string())
});

type SampleSchema = z.infer<typeof sampleSchema>;

const Component = ({
  children
}: {
  children: React.ReactNode;
}): React.ReactElement => {
  const form = useForm<SampleSchema>({
    resolver: zodResolver(sampleSchema),
    defaultValues: {
      sample: ["option-1"]
    }
  });

  return <Form providerProps={form}>{children}</Form>;
};

const meta: Meta<typeof FormMultiSelect> = {
  title: "Components/form-multi-select",
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
    helperText: "Form multi-select helper text",
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
