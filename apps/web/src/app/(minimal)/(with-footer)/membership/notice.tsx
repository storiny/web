import React from "react";

import Link from "~/components/link";
import Typography from "~/components/typography";
import css from "~/theme/main.module.scss";

const MembershipNotice = (): React.ReactElement => (
  <Typography
    as={"div"}
    className={css["flex-col"]}
    color={"minor"}
    level={"body2"}
    style={{ gap: "12px", paddingBlock: "32px" }}
  >
    <div>
      We do not offer free trials at the moment. The monthly cost of the
      Storiny+ membership does not include the tax amount. Please review the
      total amount on the checkout page.
    </div>
    <div>
      We do not offer refunds for membership. You can cancel your membership
      anytime through your dashboard. The membership benefits will be retained
      until the end of the current billing cycle. Once your subscription
      expires, the membership features will be locked for your blogs until you
      subscribe again. All blogs connected to your account, except your latest
      one, will enter read-only mode, and no new stories can be published in
      them until the subscription renews.
    </div>
    <div>
      Your payments are processed through Stripe, and the availability of
      Storiny+ depends on your region. Storiny+ is currently only available in
      the countries listed in Stripe’s global availability zone. You can view
      the list of supported countries here at{" "}
      <Link
        href={"https://stripe.com/global"}
        rel={"noreferrer"}
        target={"_blank"}
        underline={"always"}
      >
        https://stripe.com/global
      </Link>
      .
    </div>
    <div>
      You must be at least 13 years old to use Storiny or subscribe to Storiny+.
      Kindly review our{" "}
      <Link href={"/terms"} target={"_blank"} underline={"always"}>
        terms of service
      </Link>
      .
    </div>
    <div>
      Stripe and the Stripe logo are registered trademarks of Stripe, Inc.
    </div>
    <div>
      Hand-drawn icons by{" "}
      <Link
        href={"https://twitter.com/CosmoGorynych"}
        rel={"noreferrer"}
        target={"_blank"}
        underline={"always"}
      >
        Cosmo Myzrail Gorynych
      </Link>
      , licensed under{" "}
      <Link
        href={"https://creativecommons.org/public-domain/cc0"}
        rel={"noreferrer"}
        target={"_blank"}
        underline={"always"}
      >
        CC0
      </Link>
      .
    </div>
  </Typography>
);

export default MembershipNotice;
