import * as path from "node:path";

import loader_utils from "loader-utils";
import webpack from "webpack";

/**
 * Classname hashing config to ignore file names from classname hashes in production
 * @see https://github.com/vercel/next.js/blob/992c46e63bef20d7ab7e40131667ed3debaf67de/packages/next/build/webpack/config/blocks/css/loaders/getCssModuleLocalIdent.ts
 * @param context Webpack context
 * @param _
 * @param export_name Classname name
 * @returns {string}
 */
const hash_only_ident = (context, _, export_name) =>
  loader_utils
    .getHashDigest(
      Buffer.from(
        `filePath:${path
          .relative(context.rootContext, context.resourcePath)
          .replace(/\\+/g, "/")}#className:${export_name}`
      ),
      "md4",
      "base64",
      6
    )
    .replace(/[^a-zA-Z0-9-_]/g, "_")
    .replace(/^(-?\d|--)/, "_$1");

/** @type {import('next').NextConfig['webpack']} */
export const webpack_config = (config, { dev }) => {
  /**
   * Loaders
   */
  config.module.rules.push(
    ...[
      {
        test: /\.txt$/i,
        use: "raw-loader"
      }
    ]
  );

  /**
   * Sentry
   */
  config.plugins.push(
    new webpack.DefinePlugin({
      __SENTRY_DEBUG__: false,
      __SENTRY_TRACING__: false,
      __RRWEB_EXCLUDE_IFRAME__: true,
      __RRWEB_EXCLUDE_SHADOW_DOM__: true,
      __SENTRY_EXCLUDE_REPLAY_WORKER__: true
    })
  );

  /**
   * Indeterministic classnames
   */
  const rules = config.module.rules
    .find((rule) => typeof rule.oneOf === "object")
    .oneOf.filter((rule) => Array.isArray(rule.use));

  if (!dev) {
    rules.forEach((rule) => {
      rule.use.forEach((module_loader) => {
        if (
          module_loader.loader?.includes("css-loader") &&
          !module_loader.loader?.includes("postcss-loader") &&
          module_loader.options.modules
        ) {
          module_loader.options.modules.getLocalIdent = hash_only_ident;
        }
      });
    });
  }

  return config;
};
