import React from "react";

/*
 * Polymorphic components.
 * Taken from https://github.com/chakra-ui/chakra-ui
 */

export type As = React.ElementType;

/**
 * Extract the props of a React element or component.
 */
export type PropsOf<T extends As> = React.ComponentPropsWithoutRef<T> & {
  as?: As;
};

export type OmitCommonProps<
  Target,
  OmitAdditionalProps extends keyof any = never
> = Omit<
  Target,
  "transition" | "as" | "color" | "translate" | OmitAdditionalProps
> & {
  // eslint-disable-next-line prefer-snakecase/prefer-snakecase
  htmlTranslate?: "yes" | "no" | undefined;
};

export type RightJoinProps<
  SourceProps extends object = object,
  OverrideProps extends object = object
> = OmitCommonProps<SourceProps, keyof OverrideProps> & OverrideProps;

export type MergeWithAs<
  ComponentProps extends object,
  AsProps extends object,
  AdditionalProps extends object = object,
  AsComponent extends As = As
> = (
  | RightJoinProps<ComponentProps, AdditionalProps>
  | RightJoinProps<AsProps, AdditionalProps>
) & {
  as?: AsComponent;
};

/* eslint-disable prefer-snakecase/prefer-snakecase */
export type ComponentWithAs<
  Component extends As,
  Props extends object = object
> = {
  <AsComponent extends As = Component>(
    props: MergeWithAs<
      React.ComponentProps<Component>,
      React.ComponentProps<AsComponent>,
      Props,
      AsComponent
    >
  ): React.ReactElement;
  contextTypes?: React.ValidationMap<any>;
  defaultProps?: Partial<any>;
  displayName?: string;
  id?: string;
  propTypes?: React.WeakValidationMap<any>;
};
/* eslint-enable prefer-snakecase/prefer-snakecase */

export type PolymorphicComponent<
  T extends As,
  P extends object = object
> = ComponentWithAs<T, P>;

export type PolymorphicProps<T extends As> = Omit<PropsOf<T>, "ref"> & {
  /*
   * Replaces the root element.
   */
  as?: As;
};
