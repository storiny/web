#!/bin/bash

# Generates template data

markups_dir="markups"
templates_dir="templates"
text_files_dir="text"
partials_dir="${markups_dir}/partials"
output_dir="generated"

# Generate HTML from MJML files and store in `output_dir`
find "$markups_dir" -type f -name '*.mjml' -not -path "$partials_dir/*" | while read -r file; do
  [ -f "$file" ] || continue
  filename=$(basename "$file" | rev | cut -d. -f2- | rev)
  mjml "$file" \
    --config.beautify false \
    --config.minify true \
    --config.minifyOptions='{"minifyCSS": true, "removeEmptyAttributes": true}' \
    --output "$output_dir/$filename.html"
done

# Update the template JSON files
find "$templates_dir" -type f -name '*.json' | while read -r file; do
  [ -f "$file" ] || continue
  template_name=$(basename "$file" | rev | cut -d. -f2- | rev)

  text_value=$(cat "$text_files_dir/$template_name.txt")
  html_value=$(cat "$output_dir/$template_name.html")

  # Serialize the values to the template JSON file
  jq --arg next_value "$text_value" '.Template.TextPart = $next_value' "$templates_dir/$template_name.json" > data.json && mv data.json "$templates_dir/$template_name.json"
  jq --arg next_value "$html_value" '.Template.HtmlPart = $next_value' "$templates_dir/$template_name.json" > data.json && mv data.json "$templates_dir/$template_name.json"
done
