import loaderUtils from "loader-utils";
import * as path from "path";
 
/**
 * Classname hashing config to ignore file names from classname hashes in production
 * @see https://github.com/vercel/next.js/blob/992c46e63bef20d7ab7e40131667ed3debaf67de/packages/next/build/webpack/config/blocks/css/loaders/getCssModuleLocalIdent.ts
 * @param context Webpack context
 * @param _
 * @param exportName Classname name
 * @returns {string}
 */
const hashOnlyIdent = (context, _, exportName) =>
  loaderUtils
    .getHashDigest(
      Buffer.from(
        `filePath:${path
          .relative(context.rootContext, context.resourcePath)
          .replace(/\\+/g, "/")}#className:${exportName}`
      ),
      "md4",
      "base64",
      6
    )
    .replace(/[^a-zA-Z0-9-_]/g, "_")
    .replace(/^(-?\d|--)/, "_$1");

/** @type {import('next').NextConfig['webpack']} */
export const webpackConfig = (config, { dev }) => {
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

  const rules = config.module.rules
    .find((rule) => typeof rule.oneOf === "object")
    .oneOf.filter((rule) => Array.isArray(rule.use));

  if (!dev) {
    rules.forEach((rule) => {
      rule.use.forEach((moduleLoader) => {
        if (
          moduleLoader.loader?.includes("css-loader") &&
          !moduleLoader.loader?.includes("postcss-loader")
        ) {
          moduleLoader.options.modules.getLocalIdent = hashOnlyIdent;
        }
      });
    });
  }

  return config;
};
