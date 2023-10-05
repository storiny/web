#!/bin/bash

# Formats SQL files
# Requires https://github.com/darold/pgFormatter to be installed on the host system

for file in ./migrations/*.sql; do
  pg_format --config ./pg_format.conf --output "$file" -- "$file"
done
