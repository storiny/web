import { zodResolver } from "@hookform/resolvers/zod";
import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";
import { z } from "zod";

import Form, { useForm } from "~/components/Form";
import Option from "~/components/Option";
import { render_test_with_provider } from "src/redux/test-utils";

import FormSelect from "./FormSelect";
import { FormSelectProps } from "./FormSelect.props";

const testSchema = z.object({
  select: z.string()
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
      select: "option-1"
    }
  });

  return (
    <Form disabled={disabled} providerProps={form}>
      {children}
    </Form>
  );
};

describe("<FormSelect />", () => {
  it("matches snapshot", () => {
    const { container } = render_test_with_provider(
      <Component>
        <FormSelect label={"Test label"} name={"select"} open>
          {[...Array(3)].map((_, index) => (
            <Option key={index} value={`option-${index}`}>
              Option
            </Option>
          ))}
        </FormSelect>
      </Component>
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(
      <Component>
        <FormSelect label={"Test label"} name={"select"} open>
          {[...Array(3)].map((_, index) => (
            <Option key={index} value={`option-${index}`}>
              Option
            </Option>
          ))}
        </FormSelect>
      </Component>
    );

    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("consumes disabled prop from `FormContext`", () => {
    const { getByTestId } = render_test_with_provider(
      <Component disabled>
        <FormSelect
          formSlotProps={
            {
              formItem: {
                "data-testid": "form-item"
              }
            } as FormSelectProps["formSlotProps"]
          }
          label={"Test label"}
          name={"select"}
          open
        >
          {[...Array(3)].map((_, index) => (
            <Option key={index} value={`option-${index}`}>
              Option
            </Option>
          ))}
        </FormSelect>
      </Component>
    );

    expect(getByTestId("form-item")).toHaveAttribute("data-disabled", "true");
  });

  it("passes props to the element slots", () => {
    const { getByTestId } = render_test_with_provider(
      <Component>
        <FormSelect
          formSlotProps={
            {
              formItem: { "data-testid": "form-item" },
              control: { "data-testid": "control" },
              label: { "data-testid": "label" },
              helperText: { "data-testid": "helper-text" }
            } as FormSelectProps["formSlotProps"]
          }
          helperText={"Test helper text"}
          label={"Test label"}
          name={"select"}
          open
        />
      </Component>
    );

    ["form-item", "control", "label", "helper-text"].forEach((element) => {
      expect(getByTestId(element)).toBeInTheDocument();
    });
  });
});
