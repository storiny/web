import { queryByTestId, queryByText } from "@testing-library/react";
import { useMemo } from "react";

import {
  Excalidraw,
  Footer,
  MainMenu
} from "../../../lib/packages/excalidraw/index";
import { GRID_SIZE, THEME } from "../../constants";
import { t } from "../../i18n";
import { fireEvent, GlobalTestState, render, toggleMenu } from "../test-utils";

const { h } = window;

describe("<Excalidraw/>", () => {
  afterEach(() => {
    const menu = document.querySelector(".dropdown-menu");
    if (menu) {
      toggleMenu(document.querySelector(".excalidraw")!);
    }
  });

  describe("Test zenModeEnabled prop", () => {
    it('should show exit zen mode button when zen mode is set and zen mode option in context menu when zenModeEnabled is "undefined"', async () => {
      const { container } = await render(<Excalidraw />);
      expect(
        container.getLayersByClassName("disable-zen-mode--visible").length
      ).toBe(0);
      expect(h.state.zenModeEnabled).toBe(false);

      fireEvent.contextMenu(GlobalTestState.canvas, {
        button: 2,
        clientX: 1,
        clientY: 1
      });
      const contextMenu = document.querySelector(".context-menu");
      fireEvent.click(queryByText(contextMenu as HTMLLayer, "Zen mode")!);
      expect(h.state.zenModeEnabled).toBe(true);
      expect(
        container.getLayersByClassName("disable-zen-mode--visible").length
      ).toBe(1);
    });

    it("should not show exit zen mode button and zen mode option in context menu when zenModeEnabled is set", async () => {
      const { container } = await render(<Excalidraw zenModeEnabled={true} />);
      expect(
        container.getLayersByClassName("disable-zen-mode--visible").length
      ).toBe(0);
      expect(h.state.zenModeEnabled).toBe(true);

      fireEvent.contextMenu(GlobalTestState.canvas, {
        button: 2,
        clientX: 1,
        clientY: 1
      });
      const contextMenu = document.querySelector(".context-menu");
      expect(
        queryByText(contextMenu as HTMLLayer, "Zen mode")
      ).not.toBeInTheDocument();
      expect(h.state.zenModeEnabled).toBe(true);
      expect(
        container.getLayersByClassName("disable-zen-mode--visible").length
      ).toBe(0);
    });
  });

  it("should render the footer only when Footer is passed as children", async () => {
    //Footer not passed hence it will not render the footer
    let { container } = await render(
      <Excalidraw>
        <div>This is a custom footer</div>
      </Excalidraw>
    );
    expect(container.querySelector(".footer-center")).toBe(null);

    // Footer passed hence it will render the footer
    ({ container } = await render(
      <Excalidraw>
        <Footer>
          <div>This is a custom footer</div>
        </Footer>
      </Excalidraw>
    ));
    expect(container.querySelector(".footer-center")).toMatchInlineSnapshot(`
      <div
        class="footer-center zen-mode-transition"
      >
        <div>
          This is a custom footer
        </div>
      </div>
    `);
  });

  describe("Test gridModeEnabled prop", () => {
    it('should show grid mode in context menu when gridModeEnabled is "undefined"', async () => {
      const { container } = await render(<Excalidraw />);
      expect(h.state.gridSize).toBe(null);

      expect(
        container.getLayersByClassName("disable-zen-mode--visible").length
      ).toBe(0);
      fireEvent.contextMenu(GlobalTestState.canvas, {
        button: 2,
        clientX: 1,
        clientY: 1
      });
      const contextMenu = document.querySelector(".context-menu");
      fireEvent.click(queryByText(contextMenu as HTMLLayer, "Show grid")!);
      expect(h.state.gridSize).toBe(GRID_SIZE);
    });

    it('should not show grid mode in context menu when gridModeEnabled is not "undefined"', async () => {
      const { container } = await render(
        <Excalidraw gridModeEnabled={false} />
      );
      expect(h.state.gridSize).toBe(null);

      expect(
        container.getLayersByClassName("disable-zen-mode--visible").length
      ).toBe(0);
      fireEvent.contextMenu(GlobalTestState.canvas, {
        button: 2,
        clientX: 1,
        clientY: 1
      });
      const contextMenu = document.querySelector(".context-menu");
      expect(
        queryByText(contextMenu as HTMLLayer, "Show grid")
      ).not.toBeInTheDocument();
      expect(h.state.gridSize).toBe(null);
    });
  });

  describe("Test UIOptions prop", () => {
    describe("Test canvasActions", () => {
      it('should render menu with default items when "UIOPtions" is "undefined"', async () => {
        const { container } = await render(
          <Excalidraw UIOptions={undefined} />
        );
        //open menu
        toggleMenu(container);
        expect(queryByTestId(container, "dropdown-menu")).toMatchSnapshot();
      });

      it("should hide clear canvas button when clearCanvas is false", async () => {
        const { container } = await render(
          <Excalidraw UIOptions={{ canvasActions: { clearCanvas: false } }} />
        );
        //open menu
        toggleMenu(container);
        expect(
          queryByTestId(container, "clear-canvas-button")
        ).not.toBeInTheDocument();
      });

      it("should hide export button when export is false", async () => {
        const { container } = await render(
          <Excalidraw UIOptions={{ canvasActions: { export: false } }} />
        );
        //open menu
        toggleMenu(container);
        expect(
          queryByTestId(container, "json-export-button")
        ).not.toBeInTheDocument();
      });

      it("should hide 'Save as image' button when 'saveAsImage' is false", async () => {
        const { container } = await render(
          <Excalidraw UIOptions={{ canvasActions: { saveAsImage: false } }} />
        );
        //open menu
        toggleMenu(container);
        expect(
          queryByTestId(container, "image-export-button")
        ).not.toBeInTheDocument();
      });

      it("should hide load button when loadScene is false", async () => {
        const { container } = await render(
          <Excalidraw UIOptions={{ canvasActions: { loadScene: false } }} />
        );

        expect(queryByTestId(container, "load-button")).not.toBeInTheDocument();
      });

      it("should hide save as button when saveFileToDisk is false", async () => {
        const { container } = await render(
          <Excalidraw
            UIOptions={{ canvasActions: { export: { saveFileToDisk: false } } }}
          />
        );
        //open menu
        toggleMenu(container);
        expect(
          queryByTestId(container, "save-as-button")
        ).not.toBeInTheDocument();
      });

      it("should hide save button when saveToActiveFile is false", async () => {
        const { container } = await render(
          <Excalidraw
            UIOptions={{ canvasActions: { saveToActiveFile: false } }}
          />
        );
        //open menu
        toggleMenu(container);
        expect(queryByTestId(container, "save-button")).not.toBeInTheDocument();
      });

      it("should hide the canvas background picker when changeViewBackgroundColor is false", async () => {
        const { container } = await render(
          <Excalidraw
            UIOptions={{ canvasActions: { changeViewBackgroundColor: false } }}
          />
        );
        //open menu
        toggleMenu(container);
        expect(
          queryByTestId(container, "canvas-background-picker")
        ).not.toBeInTheDocument();
      });

      it("should hide the theme toggle when theme is false", async () => {
        const { container } = await render(
          <Excalidraw UIOptions={{ canvasActions: { toggleTheme: false } }} />
        );
        //open menu
        toggleMenu(container);
        expect(
          queryByTestId(container, "toggle-dark-mode")
        ).not.toBeInTheDocument();
      });

      it("should not render default items in custom menu even if passed if the prop in `canvasActions` is set to false", async () => {
        const { container } = await render(
          <Excalidraw UIOptions={{ canvasActions: { loadScene: false } }}>
            <MainMenu>
              <MainMenu.ItemCustom>
                <button
                  onClick={() => window.alert("custom menu item")}
                  style={{ height: "2rem" }}
                >
                  custom item
                </button>
              </MainMenu.ItemCustom>
              <MainMenu.DefaultItems.LoadScene />
            </MainMenu>
          </Excalidraw>
        );
        //open menu
        toggleMenu(container);
        // load button shouldn't be rendered since `UIActions.canvasActions.loadScene` is `false`
        expect(queryByTestId(container, "load-button")).not.toBeInTheDocument();
      });
    });
  });

  describe("Test theme prop", () => {
    it("should show the theme toggle by default", async () => {
      const { container } = await render(<Excalidraw />);
      expect(h.state.theme).toBe(THEME.LIGHT);
      //open menu
      toggleMenu(container);
      const darkModeToggle = queryByTestId(container, "toggle-dark-mode");
      expect(darkModeToggle).toBeInTheDocument();
    });

    it("should not show theme toggle when the theme prop is defined", async () => {
      const { container } = await render(<Excalidraw theme={THEME.DARK} />);

      expect(h.state.theme).toBe(THEME.DARK);
      //open menu
      toggleMenu(container);
      expect(
        queryByTestId(container, "toggle-dark-mode")
      ).not.toBeInTheDocument();
    });

    it("should show theme mode toggle when `UIOptions.canvasActions.toggleTheme` is true", async () => {
      const { container } = await render(
        <Excalidraw
          UIOptions={{ canvasActions: { toggleTheme: true } }}
          theme={THEME.DARK}
        />
      );
      expect(h.state.theme).toBe(THEME.DARK);
      //open menu
      toggleMenu(container);
      const darkModeToggle = queryByTestId(container, "toggle-dark-mode");
      expect(darkModeToggle).toBeInTheDocument();
    });

    it("should not show theme toggle when `UIOptions.canvasActions.toggleTheme` is false", async () => {
      const { container } = await render(
        <Excalidraw
          UIOptions={{ canvasActions: { toggleTheme: false } }}
          theme={THEME.DARK}
        />
      );
      expect(h.state.theme).toBe(THEME.DARK);
      //open menu
      toggleMenu(container);
      const darkModeToggle = queryByTestId(container, "toggle-dark-mode");
      expect(darkModeToggle).not.toBeInTheDocument();
    });
  });

  describe("Test name prop", () => {
    it('should allow editing name when the name prop is "undefined"', async () => {
      const { container } = await render(<Excalidraw />);
      //open menu
      toggleMenu(container);
      fireEvent.click(queryByTestId(container, "image-export-button")!);
      const textInput: HTMLInputLayer | null = document.querySelector(
        ".ImageExportModal .ImageExportModal__preview__filename .TextInput"
      );
      expect(textInput?.value).toContain(`${t("labels.untitled")}`);
      expect(textInput?.nodeName).toBe("INPUT");
    });

    it('should set the name and not allow editing when the name prop is present"', async () => {
      const name = "test";
      const { container } = await render(<Excalidraw name={name} />);
      //open menu
      toggleMenu(container);
      await fireEvent.click(queryByTestId(container, "image-export-button")!);
      const textInput = document.querySelector(
        ".ImageExportModal .ImageExportModal__preview__filename .TextInput"
      ) as HTMLInputLayer;
      expect(textInput?.value).toEqual(name);
      expect(textInput?.nodeName).toBe("INPUT");
      expect(textInput?.disabled).toBe(true);
    });
  });

  describe("Test autoFocus prop", () => {
    it("should not focus when autoFocus is false", async () => {
      const { container } = await render(<Excalidraw />);

      expect(
        container.querySelector(".excalidraw") === document.activeLayer
      ).toBe(false);
    });

    it("should focus when autoFocus is true", async () => {
      const { container } = await render(<Excalidraw autoFocus={true} />);

      expect(
        container.querySelector(".excalidraw") === document.activeLayer
      ).toBe(true);
    });
  });

  describe("<MainMenu/>", () => {
    it("should render main menu with host menu items if passed from host", async () => {
      const { container } = await render(
        <Excalidraw>
          <MainMenu>
            <MainMenu.Item onSelect={() => window.alert("Clicked")}>
              Click me
            </MainMenu.Item>
            <MainMenu.ItemLink href="blog.excalidaw.com">
              Excalidraw blog
            </MainMenu.ItemLink>
            <MainMenu.ItemCustom>
              <button
                onClick={() => window.alert("custom menu item")}
                style={{ height: "2rem" }}
              >
                custom menu item
              </button>
            </MainMenu.ItemCustom>
            <MainMenu.DefaultItems.Help />
          </MainMenu>
        </Excalidraw>
      );
      //open menu
      toggleMenu(container);
      expect(queryByTestId(container, "dropdown-menu")).toMatchSnapshot();
    });

    it("should update themeToggle text even if MainMenu memoized", async () => {
      const CustomExcalidraw = () => {
        const customMenu = useMemo(
          () => (
            <MainMenu>
              <MainMenu.DefaultItems.ToggleTheme />
            </MainMenu>
          ),
          []
        );

        return <Excalidraw>{customMenu}</Excalidraw>;
      };

      const { container } = await render(<CustomExcalidraw />);
      //open menu
      toggleMenu(container);

      expect(h.state.theme).toBe(THEME.LIGHT);

      expect(
        queryByTestId(container, "toggle-dark-mode")?.textContent
      ).toContain(t("buttons.darkMode"));

      fireEvent.click(queryByTestId(container, "toggle-dark-mode")!);

      expect(
        queryByTestId(container, "toggle-dark-mode")?.textContent
      ).toContain(t("buttons.lightMode"));
    });
  });
});
