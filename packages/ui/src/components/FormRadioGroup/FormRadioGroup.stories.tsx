// noinspection JSUnusedGlobalSymbols

import { zodResolver } from "@hookform/resolvers/zod";
import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { z } from "zod";

import Form, { useForm } from "~/components/Form";
import FormRadio from "~/components/FormRadio/FormRadio";

import FormRadioGroup from "./FormRadioGroup";

const sampleSchema = z.object({
  sample: z.enum(["1", "2", "3"])
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
      sample: "1"
    }
  });

  return <Form providerProps={form}>{children}</Form>;
};

const meta: Meta<typeof FormRadioGroup> = {
  title: "Components/FormRadioGroup",
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
    helperText: "Form radio group helper text",
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
    style: { maxWidth: "300px" }
  }
};

export default meta;
type Story = StoryObj<typeof FormRadioGroup>;

export const Default: Story = {};
