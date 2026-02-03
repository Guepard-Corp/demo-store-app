# Migrations

## Clone / snapshot DBs (CI, Guepard clones)

When deploying to a clone created from a snapshot, the DB may already have columns from production. To avoid `P3006` / "column already exists" on deploy or shadow DB:

- **Add column:** use `ADD COLUMN IF NOT EXISTS` so re-running is a no-op.
- **Create index:** use `CREATE INDEX IF NOT EXISTS ...` where supported.

Example (edit the generated migration SQL):

```sql
-- Instead of: ALTER TABLE "Product" ADD COLUMN "discount_percentage" ...
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "discount_percentage" DOUBLE PRECISION;
```

Keeps fresh DBs and clone/snapshot DBs both working.
