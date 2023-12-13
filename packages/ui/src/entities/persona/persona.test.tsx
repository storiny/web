import { axe } from "@storiny/test-utils";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import { TEST_USER } from "../../mocks";
import Persona from "./persona";
import styles from "./persona.module.scss";
import { PersonaProps, PersonaSize } from "./persona.props";

describe("<Persona />", () => {
  it("renders", () => {
    render_test_with_provider(
      <Persona
        avatar={{ alt: "" }}
        primary_text={"test"}
        secondary_text={"test"}
      />
    );
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(
      <Persona
        avatar={{
          alt: "",
          avatar_id: TEST_USER.avatar_id,
          hex: TEST_USER.avatar_hex,
          label: TEST_USER.name
        }}
        primary_text={"test"}
      />
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it("does not have any accessibility violations for multiple avatars", async () => {
    const { container } = render_test_with_provider(
      <Persona
        avatar={Array(3).fill({
          alt: "",
          avatar_id: TEST_USER.avatar_id,
          hex: TEST_USER.avatar_hex,
          label: TEST_USER.name
        })}
        primary_text={"test"}
      />
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it("renders size `md`, skips rendering secondary text and AvatarGroup by default", () => {
    const { getByTestId, queryByTestId } = render_test_with_provider(
      <Persona
        avatar={{
          alt: ""
        }}
        component_props={
          {
            secondary_text: { "data-testid": "secondary-text" },
            avatar_group: { "data-testid": "avatar-group" }
          } as PersonaProps["component_props"]
        }
        data-testid={"persona"}
        primary_text={"test"}
      />
    );

    expect(getByTestId("persona")).toHaveClass(styles.md);
    expect(queryByTestId("secondary-text")).not.toBeInTheDocument();
    expect(queryByTestId("avatar-group")).not.toBeInTheDocument();
  });

  (["lg", "md", "sm", "xs"] as PersonaSize[]).forEach((size) => {
    it(`renders \`${size}\` size`, () => {
      const { getByTestId } = render_test_with_provider(
        <Persona
          avatar={{
            alt: ""
          }}
          data-testid={"persona"}
          primary_text={"test"}
          size={size}
        />
      );

      expect(getByTestId("persona")).toHaveClass(styles[size]);
    });
  });

  it("renders secondary text", () => {
    const { getByTestId } = render_test_with_provider(
      <Persona
        avatar={{
          alt: ""
        }}
        component_props={
          {
            secondary_text: { "data-testid": "secondary-text" }
          } as PersonaProps["component_props"]
        }
        primary_text={"test"}
        secondary_text={"test"}
      />
    );

    expect(getByTestId("secondary-text")).toBeInTheDocument();
  });

  it("skips rendering secondary text for size xs", () => {
    const { queryByTestId } = render_test_with_provider(
      <Persona
        avatar={{
          alt: ""
        }}
        component_props={
          {
            secondary_text: { "data-testid": "secondary-text" }
          } as PersonaProps["component_props"]
        }
        primary_text={"test"}
        secondary_text={"test"}
        size={"xs"}
      />
    );

    expect(queryByTestId("secondary-text")).not.toBeInTheDocument();
  });

  describe("multiple avatars", () => {
    it("renders AvatarGroup when an array is passed to the `avatar` prop", () => {
      const { getByTestId } = render_test_with_provider(
        <Persona
          avatar={[
            {
              alt: ""
            },
            {
              alt: ""
            }
          ]}
          component_props={
            {
              avatar_group: { "data-testid": "avatar-group" }
            } as PersonaProps["component_props"]
          }
          primary_text={"test"}
        />
      );

      expect(getByTestId("avatar-group")).toBeInTheDocument();
    });

    it("renders Avatar instead of AvatarGroup for single avatar", () => {
      const { queryByTestId } = render_test_with_provider(
        <Persona
          avatar={[
            {
              alt: ""
            }
          ]}
          component_props={
            {
              avatar_group: { "data-testid": "avatar-group" }
            } as PersonaProps["component_props"]
          }
          primary_text={"test"}
        />
      );

      expect(queryByTestId("avatar-group")).not.toBeInTheDocument();
    });
  });

  it("passes props to the component slots", () => {
    const { getByTestId } = render_test_with_provider(
      <Persona
        avatar={[
          {
            alt: ""
          },
          {
            alt: ""
          }
        ]}
        component_props={
          {
            secondary_text: { "data-testid": "secondary-text" },
            primary_text: { "data-testid": "primary-text" },
            avatar_group: { "data-testid": "avatar-group" }
          } as PersonaProps["component_props"]
        }
        primary_text={"test"}
        secondary_text={"test"}
      />
    );

    ["avatar-group", "primary-text", "secondary-text"].forEach((element) => {
      expect(getByTestId(element)).toBeInTheDocument();
    });
  });
});
