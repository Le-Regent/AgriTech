# Contributing to AgriSync Marketplace

Thank you for contributing! To maintain a clean and readable project history, we follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

## Commit Message Format

Each commit message consists of a **header**, a **body**, and a **footer**. The header has a special format that includes a **type**, a **scope**, and a **subject**:

```
<type>(<scope>): <subject>
<BLANK LINE>
<body>
<BLANK LINE>
<footer>
```

### Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code (white-space, formatting, etc.)
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **build**: Changes that affect the build system or external dependencies
- **ci**: Changes to our CI configuration files and scripts
- **chore**: Other changes that don't modify src or test files

### Example

```
feat(marketplace): add product comparison tool

- Users can now select up to 3 products to compare
- Added comparison table with nutritional and price data
```

## Pre-commit Hooks

We use **Husky** to run several checks before every commit:

1. **Linting**: Ensures code follows our ESLint rules.
2. **Formatting**: Checks if code is formatted with Prettier.
3. **Commit Linting**: Validates that your commit message follows the Conventional Commits format.

If any of these checks fail, your commit will be rejected. You can fix the issues and try again.
