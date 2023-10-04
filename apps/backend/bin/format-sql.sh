#!/bin/bash

for file in ./migrations/*.sql; do
  npx sql-formatter --fix --config .sql-formatter.json -- "$file"
done
