import { ImageSize, RSB_ITEM_PROPS } from "@storiny/shared";
import { clsx } from "clsx";
import NextLink from "next/link";
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
import { PlusBadge } from "~/entities/badges";
import Gallery from "~/entities/gallery";
import TitleBlock from "~/entities/title-block";
import CaretUpIcon from "~/icons/caret-up";
import LinkIcon from "~/icons/link";
import PhotoPlusIcon from "~/icons/photo-plus";
import PlusIcon from "~/icons/plus";
import TrashIcon from "~/icons/trash";
import XIcon from "~/icons/x";
import { use_blog_rsb_settings_mutation } from "~/redux/features";
import css from "~/theme/main.module.scss";
import { get_cdn_url } from "~/utils/get-cdn-url";
import { handle_api_error } from "~/utils/handle-api-error";

import DashboardGroup from "../../../../../../common/dashboard-group";
import common_styles from "../common.module.scss";
import styles from "./right-sidebar-items.module.scss";
import {
  RSB_SETTINGS_SCHEMA,
  RsbSettingsSchema
} from "./right-sidebar-items.schema";

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
  const form = use_form_context<RsbSettingsSchema>();
  const item_key = `items.${index}.icon` as const;
  const icon = form.watch(item_key);

  return (
    <div
      className={clsx(css["flex-center"], css["flex-col"], common_styles.icon)}
    >
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
              backgroundImage: `url("${get_cdn_url(icon, ImageSize.W_64)}")`
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
  const { control } = use_form_context<RsbSettingsSchema>();
  const { fields, append, remove, move } = use_field_array({
    control,
    name: "items"
  });

  return (
    <React.Fragment>
      <FormInput
        autoComplete={"off"}
        auto_size
        data-testid={"label-input"}
        form_slot_props={{ form_item: { className: styles["label-input"] } }}
        helper_text={"Label for the sidebar items."}
        maxLength={32}
        name={"label"}
        placeholder={"Label"}
      />
      <Divider />
      {fields.map((field, index) => (
        <div
          className={clsx(css["flex-center"], common_styles.item)}
          key={field.id}
        >
          <div className={clsx(css["flex-col"], common_styles.column)}>
            <div
              className={clsx(
                css["flex-center"],
                css["full-w"],
                common_styles["top-row"]
              )}
            >
              <Icon index={index} />
              <Divider
                className={clsx(common_styles.divider, styles.divider)}
                orientation={"vertical"}
              />
              <div
                className={clsx(
                  css["flex-center"],
                  css["flex-col"],
                  css["full-w"]
                )}
              >
                <FormInput
                  autoComplete={"off"}
                  auto_size
                  data-testid={`primary-text-input-${index}`}
                  form_slot_props={{
                    form_item: {
                      className: css["full-w"]
                    }
                  }}
                  maxLength={RSB_ITEM_PROPS.primary_text.max_length}
                  minLength={RSB_ITEM_PROPS.primary_text.min_length}
                  name={`items.${index}.primary_text`}
                  placeholder={"Primary text"}
                  required
                />
                <Spacer orientation={"vertical"} />
                <FormInput
                  autoComplete={"off"}
                  auto_size
                  data-testid={`secondary-text-input-${index}`}
                  form_slot_props={{
                    form_item: {
                      className: css["full-w"]
                    }
                  }}
                  maxLength={RSB_ITEM_PROPS.secondary_text.max_length}
                  name={`items.${index}.secondary_text`}
                  placeholder={"Secondary text"}
                />
              </div>
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
              maxLength={RSB_ITEM_PROPS.target.max_length}
              minLength={RSB_ITEM_PROPS.target.min_length}
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
              primary_text: "",
              secondary_text: "",
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

const RightSidebarItems = (): React.ReactElement => {
  const toast = use_toast();
  const blog = use_blog_context();
  const form = use_form<RsbSettingsSchema>({
    resolver: zod_resolver(RSB_SETTINGS_SCHEMA),
    defaultValues: {
      label: blog.rsb_items_label,
      items: (blog.rsb_items || []).map((item) => ({
        target: item.target,
        icon: item.icon,
        primary_text: item.primary_text,
        secondary_text: item.secondary_text
      }))
    }
  });
  const [mutate_rsb_settings, { isLoading: is_loading }] =
    use_blog_rsb_settings_mutation();

  const handle_submit: SubmitHandler<RsbSettingsSchema> = (values) => {
    mutate_rsb_settings({
      items: values.items,
      label: values.label,
      blog_id: blog.id
    })
      .unwrap()
      .then((res) => {
        blog.mutate({ rsb_items: res });
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
      <TitleBlock title={"Right sidebar items"}>
        These items are displayed in the right sidebar of your blog. You can
        showcase up to five items, such as merchandise, ebooks, or sponsorship
        links.
      </TitleBlock>
      <Spacer orientation={"vertical"} size={3} />
      {blog.has_plus_features ? (
        <Form<RsbSettingsSchema>
          className={clsx(css["flex-col"], common_styles.form)}
          disabled={is_loading}
          on_submit={handle_submit}
          provider_props={form}
        >
          <Content />
          <SaveButton is_loading={is_loading} />
        </Form>
      ) : (
        <div className={clsx(css["flex-center"], common_styles.form)}>
          <Button
            as={NextLink}
            auto_size
            className={css["fit-w"]}
            decorator={<PlusBadge no_stroke />}
            href={"/membership"}
            target={"_blank"}
            variant={"hollow"}
          >
            This is a plus feature
          </Button>
          <Grow />
        </div>
      )}
    </DashboardGroup>
  );
};

export default RightSidebarItems;
