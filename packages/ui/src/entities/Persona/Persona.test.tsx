import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import { testUser } from "../../mocks";
import Persona from "./Persona";
import styles from "./Persona.module.scss";
import { PersonaProps, PersonaSize } from "./Persona.props";

describe("<Persona />", () => {
  it("renders", async () => {
    renderTestWithProvider(
      <Persona
        avatar={{ alt: "" }}
        primaryText={"test"}
        secondaryText={"test"}
      />
    );
  });

  it("does not have any accessibility violations", async () => {
    const { container } = renderTestWithProvider(
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
    const { container } = renderTestWithProvider(
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
    const { getByTestId, queryByTestId } = renderTestWithProvider(
      <Persona
        avatar={{
          alt: ""
        }}
        componentProps={
          {
            secondaryText: { "data-testid": "secondary-text" },
            avatarGroup: { "data-testid": "avatar-group" }
          } as PersonaProps["componentProps"]
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
      const { getByTestId } = renderTestWithProvider(
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
    const { getByTestId } = renderTestWithProvider(
      <Persona
        avatar={{
          alt: ""
        }}
        componentProps={
          {
            secondaryText: { "data-testid": "secondary-text" }
          } as PersonaProps["componentProps"]
        }
        primaryText={"test"}
        secondaryText={"test"}
      />
    );

    expect(getByTestId("secondary-text")).toBeInTheDocument();
  });

  it("skips rendering secondary text for size xs", () => {
    const { queryByTestId } = renderTestWithProvider(
      <Persona
        avatar={{
          alt: ""
        }}
        componentProps={
          {
            secondaryText: { "data-testid": "secondary-text" }
          } as PersonaProps["componentProps"]
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
      const { getByTestId } = renderTestWithProvider(
        <Persona
          avatar={[
            {
              alt: ""
            },
            {
              alt: ""
            }
          ]}
          componentProps={
            {
              avatarGroup: { "data-testid": "avatar-group" }
            } as PersonaProps["componentProps"]
          }
          primaryText={"test"}
        />
      );

      expect(getByTestId("avatar-group")).toBeInTheDocument();
    });

    it("renders Avatar instead of AvatarGroup for single avatar", () => {
      const { queryByTestId } = renderTestWithProvider(
        <Persona
          avatar={[
            {
              alt: ""
            }
          ]}
          componentProps={
            {
              avatarGroup: { "data-testid": "avatar-group" }
            } as PersonaProps["componentProps"]
          }
          primaryText={"test"}
        />
      );

      expect(queryByTestId("avatar-group")).not.toBeInTheDocument();
    });
  });

  it("passes props to the component slots", () => {
    const { getByTestId } = renderTestWithProvider(
      <Persona
        avatar={[
          {
            alt: ""
          },
          {
            alt: ""
          }
        ]}
        componentProps={
          {
            secondaryText: { "data-testid": "secondary-text" },
            primaryText: { "data-testid": "primary-text" },
            avatarGroup: { "data-testid": "avatar-group" }
          } as PersonaProps["componentProps"]
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
