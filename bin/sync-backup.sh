#!/bin/zsh

# Switch to pnpm version 20.19.2
pnpm use 20.19.2

# Run directus-sync pull with the specified config
npx directus-sync pull -c ./directus-sync-configurations/local.backup.directus-sync.config.cjs
