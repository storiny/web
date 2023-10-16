// Creates or updates the templates

import {
  CreateTemplateCommand,
  UpdateTemplateCommand,
  SESClient,
  Template,
  GetTemplateCommand,
  TemplateDoesNotExistException
} from "@aws-sdk/client-ses";
import fs from "fs";
import path from "path";

const CLIENT = new SESClient({ region: "us-east-1" });
const TEMPLATE_FILES = fs
  .readdirSync("./templates")
  .filter((file) => path.extname(file) === ".json");

(async () => {
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
