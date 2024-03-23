import { ImageSize, LSB_ITEM_PROPS } from "@storiny/shared";
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
import Gallery from "~/entities/gallery";
import TitleBlock from "~/entities/title-block";
import CaretUpIcon from "~/icons/caret-up";
import LinkIcon from "~/icons/link";
import PhotoPlusIcon from "~/icons/photo-plus";
import PlusIcon from "~/icons/plus";
import TrashIcon from "~/icons/trash";
import XIcon from "~/icons/x";
import { use_blog_lsb_settings_mutation } from "~/redux/features";
import css from "~/theme/main.module.scss";
import { get_cdn_url } from "~/utils/get-cdn-url";
import { handle_api_error } from "~/utils/handle-api-error";

import DashboardGroup from "../../../../../../common/dashboard-group";
import common_styles from "../common.module.scss";
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
        Save items
      </Button>
    </div>
  );
};

const Icon = ({ index }: { index: number }): React.ReactElement => {
  const form = use_form_context<LsbSettingsSchema>();
  const item_key = `items.${index}.icon` as const;
  const icon = form.watch(item_key);

  return (
    <div className={clsx(css["flex-center"], common_styles.icon)}>
      <Gallery
        on_confirm={(asset): void => {
          form.setValue(item_key, asset.key, {
            shouldDirty: true
          });
        }}
      >
        {icon ? (
          <button
            aria-label={"Edit icon"}
            className={clsx(css.focusable, common_styles["icon-button"])}
            style={{
              backgroundImage: get_cdn_url(icon, ImageSize.W_64)
            }}
            title={"Edit icon"}
            type={"button"}
          />
        ) : (
          <IconButton
            aria-label={"Add icon"}
            auto_size
            title={"Add icon"}
            variant={"ghost"}
          >
            <PhotoPlusIcon />
          </IconButton>
        )}
      </Gallery>
      {icon && (
        <IconButton
          aria-label={"Remove icon"}
          auto_size
          onClick={(): void => {
            form.setValue(item_key, null, { shouldDirty: true });
          }}
          size={"sm"}
          title={"Remove icon"}
          variant={"ghost"}
        >
          <XIcon />
        </IconButton>
      )}
    </div>
  );
};

const Content = (): React.ReactElement => {
  const { control } = use_form_context<LsbSettingsSchema>();
  const home_item_id_ref = React.useRef<string | null>(null);
  const { fields, append, remove, move } = use_field_array({
    control,
    name: "items"
  });

  return (
    <React.Fragment>
      {fields.map((field, index) => (
        <div
          className={clsx(css["flex-center"], common_styles.item)}
          key={field.id}
        >
          <div className={clsx(css["flex-col"], common_styles.column)}>
            <div className={clsx(css["flex-center"], common_styles["top-row"])}>
              <Icon index={index} />
              <Divider
                className={clsx(common_styles.divider, styles.divider)}
                orientation={"vertical"}
              />
              <FormInput
                autoComplete={"off"}
                auto_size
                data-testid={`name-input-${index}`}
                form_slot_props={{
                  form_item: {
                    className: css["full-w"]
                  }
                }}
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
              form_slot_props={{
                form_item: {
                  className: css["full-w"]
                }
              }}
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
              common_styles.actions
            )}
          >
            <IconButton
              aria-label={"Move item up"}
              auto_size
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
              auto_size
              color={"ruby"}
              disabled={
                (home_item_id_ref.current === null
                  ? field.target === "/"
                  : home_item_id_ref.current === field.id) ||
                fields.length === 1
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
              auto_size
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
      {fields.length < 5 && (
        <Button
          auto_size
          className={clsx(css["fit-w"], common_styles["add-item"])}
          decorator={<PlusIcon />}
          onClick={(): void =>
            append({
              name: "",
              target: "",
              icon: null
            })
          }
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
        name: item.name,
        icon: item.icon
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
        className={clsx(css["flex-col"], common_styles.form)}
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
