# Security policy

## Secrets and credentials

Never commit passwords, API secrets, refresh tokens, service-role keys, private keys or local environment files to this repository.

Sensitive configuration must be stored in the deployment platform's environment variables. If a credential is ever committed, removing it from a later commit is not enough: rotate/revoke the credential immediately and then clean the repository history if necessary.

## Production changes

Changes to production should be made from a branch, validated by the repository checks, reviewed through a Pull Request and merged into `main` only after the checks pass.

## Minimum checks

- `Production Safety / Preflight build and isolation`
- `Security Scan / Secret scan`
- Vercel Preview validation for visual or functional changes

Direct pushes and force pushes to `main` should be blocked through GitHub branch protection/rulesets when those repository settings are available.
