# Update CAL version with Migrations

## Update from Upstream REPO

To update tags from upstream repo you have to add upstream repo and than execute:

```bash
git fetch --tags upstream
git push --tags
```

## Update database migrations

```bash
yarn workspace @calcom/prisma db-deploy
```

fix an error while the migration by rollbacking

```bash
yarn prisma migrate resolve --rolled-back "MIGRATON_NAME_YYYY_MM_DD"
```

 more details are [here](https://www.prisma.io/docs/orm/prisma-migrate/workflows/patching-and-hotfixing#failed-migration)

## Platform FEES

platform fees see [github ticket](https://github.com/calcom/cal.com/discussions/18510?sort=old)
