# Directus Sync instructions

## Pull or backup local Directus instance

```bash
npx directus-sync pull -c ./directus-sync-configurations/local.backup.directus-sync.config.cjs
```

Or using the npm script:
```bash
pnpm run sync:pull
```

## Push or bootstrap local Directus instance

```bash
npx directus-sync push -c ./directus-sync-configurations/local.bootstrap.directus-sync.config.cjs
```

Or using the npm script:
```bash
pnpm run sync:push
```

## Push or bootstrap local to production Directus instance

```bash
npx directus-sync push -c ./directus-sync-configurations/local-to-production.bootstrap.directus-sync.config.cjs
```