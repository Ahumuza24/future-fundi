# Contributing to Future Fundi

Thank you for contributing! This guide explains the workflow, standards, and process for getting changes merged.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Git Workflow](#git-workflow)
- [Coding Standards](#coding-standards)
- [Pull Request Process](#pull-request-process)
- [Testing Requirements](#testing-requirements)
- [Commit Messages](#commit-messages)

---

## Code of Conduct

Be respectful, constructive, and patient. We are all learning. Harassment of any kind will not be tolerated.

---

## Getting Started

1. Fork (external contributors) or clone the repo directly (team members)
2. Follow the [Setup Guide](SETUP_GUIDE.md) to get your local environment running
3. Pick up a task from the issue tracker or confirm with the team lead before starting new work
4. Never commit directly to `main`

---

## Git Workflow

We use a **feature branch workflow**:

```
main          ← always stable, deployable
  └── feature/<short-description>   ← your work
  └── fix/<short-description>       ← bug fixes
  └── chore/<short-description>     ← non-functional changes (deps, docs, config)
  └── hotfix/<short-description>    ← urgent production fixes
```

### Step by step

```bash
# 1. Start from an up-to-date main
git checkout main
git pull origin main

# 2. Create your branch
git checkout -b feature/student-dashboard-redesign

# 3. Make your changes, commit often
git add .
git commit -m "feat(student): add pathway progress sidebar"

# 4. Keep up to date with main (rebase, not merge)
git fetch origin
git rebase origin/main

# 5. Push and open a PR
git push origin feature/student-dashboard-redesign
```

---

## Coding Standards

### Backend (Python / Django)

- **Formatter:** `black` — run `black .` before committing
- **Linter:** `ruff` — run `ruff check .` before committing
- **Type hints:** Use them on all new functions
- **Docstrings:** Add a one-line docstring to every ViewSet and complex function
- **Imports:** Group as: stdlib → third-party → local. Use `isort` or let `ruff` handle it
- **No bare `except:`** — always catch specific exceptions
- **QuerySet discipline:** Always call `.select_related()` / `.prefetch_related()` for FK traversals to avoid N+1 queries
- **Never put business logic in serializers** — serializers validate and transform; logic goes in the ViewSet or a helper function

```python
# ✅ Good
def dashboard(self, request, **kwargs):
    """Return aggregated dashboard data for the authenticated learner."""
    learner = Learner.objects.select_related("user").get(user=request.user)
    ...

# ❌ Bad — no docstring, no type hints, bare except
def dashboard(self, request):
    try:
        learner = Learner.objects.get(user=request.user)
    except:
        return Response({})
```

### Frontend (TypeScript / React)

- **Formatter:** `prettier` (integrated via ESLint config) — VSCode formats on save
- **Linter:** `eslint` — run `pnpm lint` before committing
- **Typing:** No `any` types. Use explicit interfaces for all API response shapes
- **Components:** Functional components only. Hooks for state/effects
- **File naming:** `PascalCase.tsx` for components, `camelCase.ts` for utilities
- **CSS:** Tailwind utility classes preferred. Custom CSS in `index.css` using CSS variables for design tokens only
- **API calls:** Always go through `lib/api.ts` — never use raw `fetch` or a new Axios instance
- **Error handling:** Every `async` call in a `useEffect` must have a `catch` block that sets error state

```tsx
// ✅ Good
const [data, setData] = useState<DashboardData | null>(null);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  studentApi.getDashboard()
    .then(res => setData(res.data))
    .catch(() => setError('Failed to load dashboard'));
}, []);

// ❌ Bad — unhandled promise, any type
useEffect(() => {
  fetch('/api/student/dashboard/').then((r: any) => setData(r));
}, []);
```

---

## Pull Request Process

### Before opening a PR

- [ ] All existing tests pass
- [ ] `ruff check .` and `black .` pass (backend)
- [ ] `pnpm lint` passes (frontend)
- [ ] No `console.log` or debug print statements left in
- [ ] No `.env` files or credentials committed
- [ ] New backend endpoints have been tested via the Django dev server
- [ ] Database migrations are included if models changed (`python manage.py makemigrations`)

### PR description template

```markdown
## What does this PR do?
Brief description of the change.

## Why?
Context — link to issue, user request, or design doc.

## How to test?
Step-by-step instructions to verify the change manually.

## Screenshots (if UI change)
Before / After screenshots or a recording.

## Checklist
- [ ] Tests pass
- [ ] Lint passes
- [ ] Migrations included (if applicable)
- [ ] No debug code
```

### Review process

1. At least **1 approval** required before merging
2. Address all review comments before requesting re-review
3. Squash merge into `main` — keep the commit history clean
4. Delete your branch after merge

---

## Testing Requirements

### Backend

- Write Django unit tests for any new ViewSet action in `backend/tests/`
- Test both the happy path and common error cases (wrong role, missing data)
- Run with: `python manage.py test`

### Frontend

- For complex logic (helpers, data transformations), add a test
- UI component testing is currently done manually — screenshots in PRs are required for UI changes

---

## Commit Messages

Follow **Conventional Commits**: `<type>(<scope>): <summary>`

| Type | Use when |
|---|---|
| `feat` | Adding a new feature |
| `fix` | Fixing a bug |
| `chore` | Dependency updates, config changes, no code change |
| `docs` | Documentation only |
| `refactor` | Code restructure with no behaviour change |
| `style` | Formatting, whitespace (no logic change) |
| `test` | Adding or fixing tests |
| `perf` | Performance improvement |

**Examples:**
```
feat(teacher): add session edit modal
fix(student): currentModule now shows microcredential name not level
chore(deps): upgrade framer-motion to 11.3
docs: add architecture diagram to ARCHITECTURE.md
refactor(api): extract pathway color logic to helper function
```

---

## Questions?

If you're unsure about anything:
1. Check the existing `docs/` folder — your question may already be answered
2. Ask in the team chat before making assumptions
3. If something in the codebase seems wrong, raise it in a PR comment rather than silently patching it
