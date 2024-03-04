import { LSB_ITEM_PROPS } from "@storiny/shared";
import { clsx } from "clsx";
import React from "react";

import { use_blog_context } from "~/common/context/blog";
import Button from "~/components/button";
import Divider from "~/components/divider";
import Form, {
  SubmitHandler,
  use_field_array,
  use_form,
  use_form_context,
  zod_resolver
} from "~/components/form";
import FormInput from "~/components/form-input";
import Grow from "~/components/grow";
import IconButton from "~/components/icon-button";
import Spacer from "~/components/spacer";
import { use_toast } from "~/components/toast";
import TitleBlock from "~/entities/title-block";
import CaretUpIcon from "~/icons/caret-up";
import LinkIcon from "~/icons/link";
import PhotoPlusIcon from "~/icons/photo-plus";
import PlusIcon from "~/icons/plus";
import TrashIcon from "~/icons/trash";
import { use_blog_lsb_settings_mutation } from "~/redux/features";
import css from "~/theme/main.module.scss";
import { handle_api_error } from "~/utils/handle-api-error";

import DashboardGroup from "../../../../../../common/dashboard-group";
import styles from "./navigation-items.module.scss";
import {
  LSB_SETTINGS_SCHEMA,
  LsbSettingsSchema
} from "./navigation-items.schema";

const SaveButton = ({
  is_loading
}: {
  is_loading: boolean;
}): React.ReactElement => {
  const { formState: form_state } = use_form_context();
  return (
    <div className={css["flex"]}>
      <Grow />
      <Button
        auto_size
        check_auth
        disabled={!form_state.isDirty}
        loading={is_loading}
        type={"submit"}
      >
        Save
      </Button>
    </div>
  );
};

const Content = (): React.ReactElement => {
  const { control } = use_form_context();
  const home_item_id_ref = React.useRef<string | null>(null);
  const { fields, append, remove, move } = use_field_array({
    control,
    name: "items"
  });

  return (
    <React.Fragment>
      <div className={clsx(css["flex-col"], styles.list)}>
        {fields.map((field, index) => (
          <div className={clsx(css["flex-center"], styles.item)} key={field.id}>
            <div className={clsx(css["flex-col"], styles.column)}>
              <div className={clsx(css["flex-center"], styles["top-row"])}>
                <div className={clsx(css["flex-center"], styles.icon)}>
                  <IconButton
                    aria-label={"Add icon"}
                    title={"Add icon"}
                    variant={"ghost"}
                  >
                    <PhotoPlusIcon />
                  </IconButton>
                </div>
                <Divider className={styles.divider} orientation={"vertical"} />
                <FormInput
                  autoComplete={"off"}
                  auto_size
                  data-testid={`name-input-${index}`}
                  maxLength={LSB_ITEM_PROPS.name.max_length}
                  minLength={LSB_ITEM_PROPS.name.min_length}
                  name={`items.${index}.name`}
                  placeholder={"Name"}
                  required
                />
              </div>
              <FormInput
                autoComplete={"url"}
                auto_size
                data-testid={`target-input-${index}`}
                decorator={<LinkIcon />}
                // Disable home item
                is_field_disabled={(input): boolean => {
                  if (input.value === "/" && !home_item_id_ref.current) {
                    home_item_id_ref.current = field.id;
                  }

                  return home_item_id_ref.current === field.id;
                }}
                maxLength={LSB_ITEM_PROPS.target.max_length}
                minLength={LSB_ITEM_PROPS.target.min_length}
                name={`items.${index}.target`}
                placeholder={"Link"}
                required
              />
            </div>
            <Grow />
            <div
              className={clsx(
                css["flex-col"],
                css["flex-center"],
                styles.actions
              )}
            >
              <IconButton
                aria-label={"Move item up"}
                disabled={index === 0}
                onClick={(): void => move(index, index - 1)}
                size={"sm"}
                title={"Move up"}
                variant={"ghost"}
              >
                <CaretUpIcon />
              </IconButton>
              <IconButton
                aria-label={"Remove item"}
                color={"ruby"}
                disabled={
                  fields.length === 1 || home_item_id_ref.current === field.id
                }
                onClick={(): void => remove(index)}
                size={"sm"}
                title={"Remove item"}
                variant={"ghost"}
              >
                <TrashIcon />
              </IconButton>
              <IconButton
                aria-label={"Move item down"}
                disabled={index === fields.length - 1}
                onClick={(): void => move(index, index + 1)}
                size={"sm"}
                title={"Move down"}
                variant={"ghost"}
              >
                <CaretUpIcon rotation={180} />
              </IconButton>
            </div>
          </div>
        ))}
      </div>
      {fields.length < 5 && (
        <Button
          auto_size
          className={css["fit-w"]}
          decorator={<PlusIcon />}
          onClick={(): void => append({ name: "", target: "" })}
          variant={"ghost"}
        >
          Add item
        </Button>
      )}
    </React.Fragment>
  );
};

const NavigationItems = (): React.ReactElement => {
  const toast = use_toast();
  const blog = use_blog_context();
  const form = use_form<LsbSettingsSchema>({
    resolver: zod_resolver(LSB_SETTINGS_SCHEMA),
    defaultValues: {
      items: (blog.lsb_items || []).map((item) => ({
        target: item.target,
        name: item.name
      }))
    }
  });
  const [mutate_lsb_settings, { isLoading: is_loading }] =
    use_blog_lsb_settings_mutation();

  const handle_submit: SubmitHandler<LsbSettingsSchema> = (values) => {
    mutate_lsb_settings({
      items: values.items,
      blog_id: blog.id
    })
      .unwrap()
      .then((res) => {
        blog.mutate({ lsb_items: res });
        form.reset(values);
        toast("Sidebar settings updated", "success");
      })
      .catch((error) =>
        handle_api_error(
          error,
          toast,
          null,
          "Could not update the sidebar settings"
        )
      );
  };

  return (
    <DashboardGroup>
      <TitleBlock title={"Navigation items"}>
        These items are displayed in the left sidebar of your blog on desktops
        and as header tabs on mobile devices. You can add items that link to
        pages within or outside of Storiny. These items will automatically
        become active on the relevant pages present on your blog.
      </TitleBlock>
      <Spacer orientation={"vertical"} size={3} />
      <Form<LsbSettingsSchema>
        className={css["flex-col"]}
        disabled={is_loading}
        on_submit={handle_submit}
        provider_props={form}
      >
        <Content />
        <SaveButton is_loading={is_loading} />
      </Form>
    </DashboardGroup>
  );
};

export default NavigationItems;
