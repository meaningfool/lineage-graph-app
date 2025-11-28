# CLAUDE.md

Context for Claude Code working on this repository.

## Workflow

We use **Spec-Driven Development**. Read `specs/README.md` for full policy.

1. Check `specs/` for the active feature folder
2. Read `task.md` in that folder for current status
3. Ask before acting on new chats

## Commands

```bash
# Dev
pnpm dev              # All apps (web :3001, server :3000)
pnpm dev:web          # Web only

# Test
pnpm --filter web test:run           # Unit (Vitest)
cd apps/web && pnpm test:e2e         # E2E (Playwright)

# Quality
pnpm check-types      # TypeScript
pnpm check            # Biome lint/format
```

## Testing

- **E2E-first**: Playwright tests are the primary spec
- **data-testid**: Always use for selectors (stripped in prod)
- **TDD**: Red (failing test) → Green (minimal impl) → Refactor

## Communication

- **Question** → Answer only, don't act
- **Action request** → Explain first, then do
- **Specific request** → Do exactly that, nothing else

## Commits

- `feat`: New behavior (needs tests)
- `refactor`: Restructure without new behavior (includes styling)
- `fix`, `test`, `docs`, `chore`: Standard meanings
- Separate structure commits from feature commits
