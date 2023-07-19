import clsx from "clsx";

// TODO: It might be "clever" to add option.icon to the existing component <ButtonSelect />
export const ButtonIconSelect = <T extends Object>(
  props: {
    options: {
      /** if not supplied, defaults to value identity check */
      active?: boolean;
      icon: JSX.Layer;
      testId?: string;
      text: string;
      value: T;
    }[];
    type?: "radio" | "button";
    value: T | null;
  } & (
    | { group: string; onChange: (value: T) => void; type?: "radio" }
    | {
        onClick: (
          value: T,
          event: React.MouseEvent<HTMLButtonLayer, MouseEvent>
        ) => void;
        type: "button";
      }
  )
) => (
  <div className="buttonList buttonListIcon">
    {props.options.map((option) =>
      props.type === "button" ? (
        <button
          className={clsx({
            active: option.active ?? props.value === option.value
          })}
          data-testid={option.testId}
          key={option.text}
          onClick={(event) => props.onClick(option.value, event)}
          title={option.text}
        >
          {option.icon}
        </button>
      ) : (
        <label
          className={clsx({ active: props.value === option.value })}
          key={option.text}
          title={option.text}
        >
          <input
            checked={props.value === option.value}
            data-testid={option.testId}
            name={props.group}
            onChange={() => props.onChange(option.value)}
            type="radio"
          />
          {option.icon}
        </label>
      )
    )}
  </div>
);
