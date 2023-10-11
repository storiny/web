#!/bin/bash

# Formats SQL files
# Requires https://github.com/darold/pgFormatter to be installed on the host system

source_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

find "$source_dir/../" -type f -name "*.sql" | while read -r file; do
  [ -f "$file" ] || continue
  first_line=$(head -n 1 "$file")

  # Ignore files having `-- pgfmt-ignore`
  if [[ ! "$first_line" == "-- pgfmt-ignore"* ]]; then
    pg_format --config ./pg_format.conf --output "$file" -- "$file"
  fi
done
