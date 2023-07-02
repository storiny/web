// noinspection JSUnusedGlobalSymbols

import { zodResolver } from "@hookform/resolvers/zod";
import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { z } from "zod";

import Form, { useForm } from "~/components/Form";

import FormInput from "./FormInput";

const sampleSchema = z.object({
  sample: z.string()
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
      sample: ""
    }
  });

  return <Form providerProps={form}>{children}</Form>;
};

const meta: Meta<typeof FormInput> = {
  title: "Components/FormInput",
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
    helperText: "Form input helper text",
    size: "md",
    color: "inverted",
    type: "text",
    placeholder: "Form input placeholder",
    name: "sample",
    formSlotProps: {
      formItem: {
        style: { maxWidth: "300px" }
      }
    }
  }
};

export default meta;
type Story = StoryObj<typeof FormInput>;

export const Default: Story = {};
