// Creates or updates the templates

import {
  CreateTemplateCommand,
  GetTemplateCommand,
  SESClient,
  Template,
  TemplateDoesNotExistException,
  UpdateTemplateCommand
} from "@aws-sdk/client-ses";
import { fromEnv as from_env } from "@aws-sdk/credential-providers"; // ES6 import
import { config } from "dotenv";
import fs from "fs";
import path from "path";

config();

const CLIENT = new SESClient({
  region: process.env.AWS_SES_REGION,
  endpoint: process.env.AWS_SES_ENDPOINT,
  credentials: from_env()
});

const TEMPLATE_FILES = fs
  .readdirSync("./templates")
  .filter((file) => path.extname(file) === ".json");

(async (): Promise<void> => {
  for (const template of TEMPLATE_FILES) {
    const template_data: { Template: Template } = JSON.parse(
      fs.readFileSync(path.join("./templates", template)).toString()
    );

    try {
      // Throws if template does not exist
      await CLIENT.send(
        new GetTemplateCommand({
          TemplateName: template_data.Template.TemplateName
        })
      );

      // Update template if present
      await CLIENT.send(
        new UpdateTemplateCommand({
          Template: template_data.Template
        })
      );
    } catch (e) {
      // Create next template
      if (e instanceof TemplateDoesNotExistException) {
        await CLIENT.send(
          new CreateTemplateCommand({
            Template: template_data.Template
          })
        );
      } else {
        throw e;
      }
    }
  }
})();
