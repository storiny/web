import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "src/redux/test-utils";

import { testUser } from "../../mocks";
import Persona from "./Persona";
import styles from "./Persona.module.scss";
import { PersonaProps, PersonaSize } from "./Persona.props";

describe("<Persona />", () => {
  it("renders", () => {
    render_test_with_provider(
      <Persona
        avatar={{ alt: "" }}
        primaryText={"test"}
        secondaryText={"test"}
      />
    );
  });

  it("does not have any accessibility violations", async () => {
    const { container } = render_test_with_provider(
      <Persona
        avatar={{
          alt: "",
          avatarId: testUser.avatar_id,
          hex: testUser.avatar_hex,
          label: testUser.name
        }}
        primaryText={"test"}
      />
    );

    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("does not have any accessibility violations for multiple avatars", async () => {
    const { container } = render_test_with_provider(
      <Persona
        avatar={Array(3).fill({
          alt: "",
          avatarId: testUser.avatar_id,
          hex: testUser.avatar_hex,
          label: testUser.name
        })}
        primaryText={"test"}
      />
    );

    await waitFor(async () =>
      expect(await axe(container)).toHaveNoViolations()
    );
  });

  it("renders size `md`, skips rendering secondary text and AvatarGroup by default", () => {
    const { getByTestId, queryByTestId } = render_test_with_provider(
      <Persona
        avatar={{
          alt: ""
        }}
        component_props={
          {
            secondaryText: { "data-testid": "secondary-text" },
            avatarGroup: { "data-testid": "avatar-group" }
          } as PersonaProps["component_props"]
        }
        data-testid={"persona"}
        primaryText={"test"}
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
          primaryText={"test"}
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
            secondaryText: { "data-testid": "secondary-text" }
          } as PersonaProps["component_props"]
        }
        primaryText={"test"}
        secondaryText={"test"}
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
            secondaryText: { "data-testid": "secondary-text" }
          } as PersonaProps["component_props"]
        }
        primaryText={"test"}
        secondaryText={"test"}
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
              avatarGroup: { "data-testid": "avatar-group" }
            } as PersonaProps["component_props"]
          }
          primaryText={"test"}
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
              avatarGroup: { "data-testid": "avatar-group" }
            } as PersonaProps["component_props"]
          }
          primaryText={"test"}
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
            secondaryText: { "data-testid": "secondary-text" },
            primaryText: { "data-testid": "primary-text" },
            avatarGroup: { "data-testid": "avatar-group" }
          } as PersonaProps["component_props"]
        }
        primaryText={"test"}
        secondaryText={"test"}
      />
    );

    ["avatar-group", "primary-text", "secondary-text"].forEach((element) => {
      expect(getByTestId(element)).toBeInTheDocument();
    });
  });
});
