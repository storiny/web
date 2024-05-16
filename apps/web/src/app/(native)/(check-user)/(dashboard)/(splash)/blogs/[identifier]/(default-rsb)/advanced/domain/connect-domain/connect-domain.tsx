"use client";

import { BLOG_PROPS } from "@storiny/shared";
import React from "react";

import { use_blog_context } from "~/common/context/blog";
import Button from "~/components/button";
import Form, {
  SubmitHandler,
  use_form,
  use_form_context,
  zod_resolver
} from "~/components/form";
import FormInput from "~/components/form-input";
import Link from "~/components/link";
import { Description, ModalFooterButton, use_modal } from "~/components/modal";
import Spacer from "~/components/spacer";
import { use_toast } from "~/components/toast";
import Typography from "~/components/typography";
import { use_media_query } from "~/hooks/use-media-query";
import LinkIcon from "~/icons/link";
import {
  use_request_blog_domain_verification_code_mutation,
  use_verify_blog_domain_mutation
} from "~/redux/features";
import { BREAKPOINTS } from "~/theme/breakpoints";
import css from "~/theme/main.module.scss";
import { handle_api_error } from "~/utils/handle-api-error";

import styles from "./connect-domain.module.scss";
import { ConnectDomainProps } from "./connect-domain.props";
import {
  CONNECT_DOMAIN_SCHEMA,
  ConnectDomainSchema
} from "./connect-domain.schema";

const ConnectDomainModal = ({ code }: { code: string }): React.ReactElement => {
  const form = use_form_context<ConnectDomainSchema>();
  const [cname, set_cname] = React.useState<string>("@");
  const domain_value = form.watch("domain");

  React.useEffect(() => {
    if (domain_value) {
      const domain_without_tld = domain_value.split(".");
      domain_without_tld.pop(); // Remove TLD
      const is_subdomain = domain_without_tld.length > 1;

      if (is_subdomain) {
        domain_without_tld.pop(); // Remove apex domain
      }

      set_cname(
        is_subdomain && domain_without_tld.length
          ? domain_without_tld.join(".")
          : "@"
      );
    } else {
      set_cname("@");
    }
  }, [domain_value]);

  return (
    <React.Fragment>
      {code ? (
        <>
          <Description asChild>
            <Typography color={"minor"} level={"body2"}>
              To connect your custom domain (
              <span className={css["t-medium"]}>{domain_value}</span>) to this
              blog, you need to set up the following records with your DNS
              provider:
            </Typography>
          </Description>
          <Spacer orientation={"vertical"} size={3} />
          <div className={styles["table-container"]}>
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Name</th>
                  <th>Content</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>CNAME</td>
                  <td data-cname={"true"}>{cname}</td>
                  <td>storiny.com</td>
                </tr>
                <tr>
                  <td>TXT</td>
                  <td>_storiny</td>
                  <td data-code={"true"}>{code}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <Spacer orientation={"vertical"} size={3} />
          <Typography color={"minor"} level={"body2"}>
            Only CNAME records are currently supported. We plan to add support
            for A/AAAA records for root domains in the future. If your DNS
            provider doesn&apos;t support CNAME at the root level, consider
            using a subdomain or switching to a provider that supports CNAME
            flattening, like{" "}
            <Link
              href={"https://cloudflare.com"}
              target={"_blank"}
              underline={"always"}
            >
              Cloudflare
            </Link>
            .
            <br />
            <br />
            Changes at your DNS provider can take up to 48 hours to propagate.
          </Typography>
        </>
      ) : (
        <>
          <Description asChild>
            <Typography color={"minor"} level={"body2"}>
              Provide the custom domain that you wish to connect to this blog.
              This can be a root-level domain, such as example.com, or a
              subdomain, like blog.example.com.
            </Typography>
          </Description>
          <Spacer orientation={"vertical"} size={3} />
          <FormInput
            autoFocus
            auto_size
            data-testid={"domain-input"}
            form_slot_props={{
              form_item: {
                className: css["f-grow"]
              }
            }}
            helper_text={
              <>
                Do not include &quot;http://&quot; or &quot;https://&quot; in
                front of your domain name.
              </>
            }
            label={"Domain name"}
            maxLength={BLOG_PROPS.domain.max_length}
            minLength={BLOG_PROPS.domain.min_length}
            name={"domain"}
            placeholder={"example.com"}
            required
          />
        </>
      )}
      <Spacer orientation={"vertical"} size={2} />
    </React.Fragment>
  );
};

const ConnectDomain = ({
  on_submit
}: ConnectDomainProps): React.ReactElement => {
  const toast = use_toast();
  const blog = use_blog_context();
  const is_smaller_than_mobile = use_media_query(BREAKPOINTS.down("mobile"));
  const [code, set_code] = React.useState<string>("");
  const form = use_form<ConnectDomainSchema>({
    resolver: zod_resolver(CONNECT_DOMAIN_SCHEMA),
    defaultValues: {
      domain: ""
    }
  });
  const [verify_blog_domain, { isLoading: is_verification_loading }] =
    use_verify_blog_domain_mutation();
  const [request_verification_code, { isLoading: is_code_request_loading }] =
    use_request_blog_domain_verification_code_mutation();
  const is_loading = is_code_request_loading || is_verification_loading;

  /**
   * Requests the verification code for a particular domain.
   */
  const get_verification_code: SubmitHandler<ConnectDomainSchema> = (
    values
  ) => {
    if (on_submit) {
      on_submit(values);
    } else {
      request_verification_code({ domain: values.domain, blog_id: blog.id })
        .unwrap()
        .then((res) => set_code(res.code))
        .catch((error) =>
          handle_api_error(
            error,
            toast,
            form,
            "Could not generate the verification code"
          )
        );
    }
  };

  /**
   * Handles the verification for a particular domain.
   */
  const handle_verification: SubmitHandler<ConnectDomainSchema> = (values) => {
    verify_blog_domain({ domain: values.domain, blog_id: blog.id })
      .unwrap()
      .then(() => {
        blog.mutate({ domain: values.domain });
        toast("Domain verified successfully", "success");
      })
      .catch((error) =>
        handle_api_error(error, toast, null, "Could not verify this domain")
      );
  };

  const handle_submit = code ? handle_verification : get_verification_code;

  const [element] = use_modal(
    ({ open_modal }) => (
      <Button
        auto_size
        check_auth
        className={css["fit-w"]}
        onClick={open_modal}
      >
        Connect
      </Button>
    ),
    <Form<ConnectDomainSchema>
      className={css["flex-col"]}
      disabled={is_loading}
      on_submit={handle_submit}
      provider_props={form}
    >
      <ConnectDomainModal code={code} />
    </Form>,
    {
      fullscreen: is_smaller_than_mobile,
      footer: (
        <>
          <ModalFooterButton compact={is_smaller_than_mobile} variant={"ghost"}>
            Cancel
          </ModalFooterButton>
          <ModalFooterButton
            compact={is_smaller_than_mobile}
            disabled={!form.formState.isDirty}
            loading={is_loading}
            onClick={(event): void => {
              event.preventDefault(); // Prevent closing of modal
              form.handleSubmit(handle_submit)(); // Submit manually
            }}
          >
            {code ? "Verify" : "Continue"}
          </ModalFooterButton>
        </>
      ),
      slot_props: {
        footer: {
          compact: is_smaller_than_mobile
        },
        content: {
          style: {
            width: is_smaller_than_mobile ? "100%" : code ? "480px" : "350px"
          }
        },
        header: {
          decorator: <LinkIcon />,
          children: "Connect your domain"
        }
      }
    }
  );

  return element;
};

export default ConnectDomain;
