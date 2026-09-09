# EnerSight Backend Operations

## Database migrations

Schema changes are deployment operations and must not be applied by API startup.
After the deployment environment injects `DATABASE_URL`, run:

```bash
cd backend
python -m app.migrations
```

The migration runner records revision `0001_initial_schema` in the
`schema_migration` table and is idempotent. Future schema changes must add a
new explicit revision and preserve an upgrade path.

## Tests

Run the executable Stage 4 regression suite with:

```bash
cd backend
pytest tests/unit
```

## Logging

The API and worker write newline-delimited JSON events to standard output.
Events carry a correlation identifier and lifecycle outcome, but never include
CSV payloads, raw meter readings, database URLs, credentials, tokens, storage
references, or unredacted exceptions.
