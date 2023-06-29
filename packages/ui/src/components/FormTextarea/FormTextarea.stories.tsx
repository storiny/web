// noinspection JSUnusedGlobalSymbols

import { zodResolver } from "@hookform/resolvers/zod";
import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { z } from "zod";

import Form, { useForm } from "~/components/Form";

import FormTextarea from "./FormTextarea";

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

const meta: Meta<typeof FormTextarea> = {
  title: "Components/FormTextarea",
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
    helperText: "Form textarea helper text",
    size: "md",
    color: "inverted",
    placeholder: "Form textarea placeholder",
    name: "sample",
    formSlotProps: {
      formItem: {
        style: { maxWidth: "300px" }
      }
    }
  }
};

export default meta;
type Story = StoryObj<typeof FormTextarea>;

export const Default: Story = {};
