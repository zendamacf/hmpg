---
'hmpg': major
---

Upgrade PostgreSQL from 16 to 18. Existing Compose installs start with an empty database, which only loses the cached photo pool. To keep it, run `docker compose exec postgres pg_dump -U hmpg hmpg > backup.sql` before updating, then `docker compose exec -T postgres psql -U hmpg hmpg < backup.sql` after.
