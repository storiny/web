import { zodResolver } from "@hookform/resolvers/zod";
import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";
import { z } from "zod";

import Form, { useForm } from "~/components/Form";
import FormRadio from "~/components/FormRadio/FormRadio";
import { render_test_with_provider } from "src/redux/test-utils";

import FormRadioGroup from "./FormRadioGroup";
import { FormRadioGroupProps } from "./FormRadioGroup.props";

const testSchema = z.object({
  radioGroup: z.enum(["1", "2", "3"])
});

type TestSchema = z.infer<typeof testSchema>;

const Component = ({
  children,
  disabled
}: {
  children: React.ReactNode;
  disabled?: boolean;
}): React.ReactElement => {
  const form = useForm<TestSchema>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      radioGroup: "1"
    }
  });

  return (
    <Form disabled={disabled} providerProps={form}>
      {children}
    </Form>
  );
};

describe("<FormRadioGroup />", () => {
  it("matches snapshot", () => {
    const { container } = render_test_with_provider(
      <Component>
        <FormRadioGroup label={"Test label"} name={"radioGroup"}>
          {[...Array(3)].map((_, index) => (
            <FormRadio
              aria-label={"Sample radio"}
              key={index}
              label={"Radio label"}
              value={String(index)}
            />
          ))}
        </FormRadioGroup>
      </Component>
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(
      <Component>
        <FormRadioGroup label={"Test label"} name={"radioGroup"}>
          {[...Array(3)].map((_, index) => (
            <FormRadio
              aria-label={"Sample radio"}
              key={index}
              label={"Radio label"}
              value={String(index)}
            />
          ))}
        </FormRadioGroup>
      </Component>
    );

    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("consumes disabled prop from `FormContext`", () => {
    const { getByTestId } = render_test_with_provider(
      <Component disabled>
        <FormRadioGroup
          formSlotProps={
            {
              formItem: { "data-testid": "form-item" }
            } as FormRadioGroupProps["formSlotProps"]
          }
          label={"Test label"}
          name={"radioGroup"}
        >
          {[...Array(3)].map((_, index) => (
            <FormRadio
              aria-label={"Sample radio"}
              key={index}
              label={"Radio label"}
              value={String(index)}
            />
          ))}
        </FormRadioGroup>
      </Component>
    );

    expect(getByTestId("form-item")).toHaveAttribute("data-disabled", "true");
  });

  it("passes props to the element slots", () => {
    const { getByTestId } = render_test_with_provider(
      <Component>
        <FormRadioGroup
          formSlotProps={
            {
              formItem: { "data-testid": "form-item" },
              control: { "data-testid": "control" },
              label: { "data-testid": "label" },
              helperText: { "data-testid": "helper-text" }
            } as FormRadioGroupProps["formSlotProps"]
          }
          helperText={"Test helper text"}
          label={"Test label"}
          name={"radioGroup"}
        />
      </Component>
    );

    ["form-item", "control", "label", "helper-text"].forEach((element) => {
      expect(getByTestId(element)).toBeInTheDocument();
    });
  });
});
