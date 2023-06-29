// noinspection JSUnusedGlobalSymbols

import { zodResolver } from "@hookform/resolvers/zod";
import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { z } from "zod";

import Form, { useForm } from "~/components/Form";

import FormCheckbox from "./FormCheckbox";

const sampleSchema = z.object({
  sample: z.boolean(),
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
      sample: false,
    },
  });

  return <Form providerProps={form}>{children}</Form>;
};

const meta: Meta<typeof FormCheckbox> = {
  title: "Components/FormCheckbox",
  component: FormCheckbox,
  decorators: [
    (Story): React.ReactElement => (
      <Component>
        <Story />
      </Component>
    ),
  ],
  tags: ["autodocs"],
  args: {
    size: "md",
    color: "inverted",
    label: "Checkbox label",
    helperText: "Form checkbox helper text",
    name: "sample",
    style: { maxWidth: "300px" },
  },
};

export default meta;
type Story = StoryObj<typeof FormCheckbox>;

export const Default: Story = {};
