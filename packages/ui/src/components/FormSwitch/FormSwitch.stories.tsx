// noinspection JSUnusedGlobalSymbols

import { zodResolver } from "@hookform/resolvers/zod";
import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { z } from "zod";

import Form, { useForm } from "~/components/Form";

import FormSwitch from "./FormSwitch";

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

const meta: Meta<typeof FormSwitch> = {
  title: "Components/FormSwitch",
  component: FormSwitch,
  decorators: [
    (Story): React.ReactElement => (
      <Component>
        <Story />
      </Component>
    ),
  ],
  tags: ["autodocs"],
  args: {
    label: "Switch label",
    helperText: "Form switch helper text",
    "aria-label": "Sample switch",
    size: "md",
    color: "inverted",
    name: "sample",
    style: { maxWidth: "300px" },
  },
};

export default meta;
type Story = StoryObj<typeof FormSwitch>;

export const Default: Story = {};
