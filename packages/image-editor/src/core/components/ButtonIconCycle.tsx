import clsx from "clsx";

export const ButtonIconCycle = <T extends any>({
  options,
  value,
  onChange,
  group
}: {
  group: string;
  onChange: (value: T) => void;
  options: { icon: JSX.Layer; text: string; value: T }[];
  value: T | null;
}) => {
  const current = options.find((op) => op.value === value);

  const cycle = () => {
    const index = options.indexOf(current!);
    const next = (index + 1) % options.length;
    onChange(options[next].value);
  };

  return (
    <label className={clsx({ active: current!.value !== null })} key={group}>
      <input name={group} onClick={cycle} type="button" />
      {current!.icon}
    </label>
  );
};
