# Import Script Spec — Deprecated

Status: deprecated historical reference.

The approved current cutover is fresh Supabase data:

```txt
No Mongo backfill.
No dual-write.
No legacy data reconciliation.
```

Do not implement a MongoDB-to-Supabase import script for the current cutover. The Supabase cutover is fully complete and MongoDB/Mongoose has been completely removed.

If historical data import is needed later, create a separate spec with explicit scope, source data validation, secret handling, rollback/restore plan, and test project requirements.
