## What changed

<!-- One or two sentences. What does this PR do, and why? -->

## How to verify

<!-- The exact commands or steps a reviewer should run. -->

```bash
docker compose up --build --wait
```

## Checklist

- [ ] Tests cover the new behavior (not just the happy path)
- [ ] `docker compose exec backend black . && docker compose exec backend flake8 .`
- [ ] `docker compose exec frontend bun run lint && docker compose exec frontend bun run build`
- [ ] Migrations included if models changed (`makemigrations --check --dry-run` is clean)
- [ ] README updated if behavior, configuration, or the API surface changed
- [ ] No secrets, tokens, or real credentials in the diff
