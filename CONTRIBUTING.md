# Contributing to CropVector

Thank you for your interest in contributing to CropVector! We welcome contributions that improve the platform, fix bugs, or enhance documentation.

## Getting started

1. Fork the repository on GitHub.
2. Clone your fork:

```bash
git clone https://github.com/Ryson-Theo/CropVector.git
```

3. Create a feature branch using a descriptive name:

```bash
git checkout -b feat/your-feature-name
```

## Environment setup

Follow `README.md` setup instructions for both `backend` and `frontend`.

### Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### Configure environment files

```bash
cd backend
cp .env.example .env
cd ../frontend
cp .env.example .env
```

On Windows CMD, use:

```bash
copy .env.example .env
```

## Code style and formatting

### Frontend linting

```bash
cd frontend && npm run lint
```

### Tests

Backend tests:

```bash
cd backend && npm test
```

Frontend tests (if available):

```bash
cd frontend && npm test
```

## Branch naming policy

Use clear, purpose-driven branch names:

- `feat/<short-description>` for new features
- `fix/<short-description>` for bug fixes
- `docs/<short-description>` for documentation changes
- `chore/<short-description>` for housekeeping

Example:

```bash
git checkout -b fix/login-session-refresh
```

## Commit message guidelines

Use conventional commit prefixes for clarity:

- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation update
- `refactor:` code restructuring
- `chore:` maintenance tasks

Example:

```bash
git commit -m "feat: add crop recommendation dashboard card"
```

## Pull request checklist

Before submitting a PR, verify that you have:

- [ ] Followed the branch naming policy
- [ ] Added or updated tests as needed
- [ ] Run frontend linting and backend tests
- [ ] Updated documentation if the change affects behavior
- [ ] Confirmed no sensitive data or `.env` files were committed
- [ ] Included a clear PR description and relevant issue references

## Updating documentation

If your change affects setup, configuration, or functionality, update the relevant documentation files such as:

- `README.md`
- `CONTRIBUTING.md`
- `CHANGELOG.md`

## Issue and PR templates

Use the GitHub templates provided under `.github/ISSUE_TEMPLATE` and `.github/PULL_REQUEST_TEMPLATE.md` when opening issues or PRs.

## Additional notes

- Keep contributions focused and easy to review.
- If you are unsure about a change, open an issue first.
- Be respectful and collaborative in review discussions.
