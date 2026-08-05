# Security Policy

## Public repository

This repository is public. Never commit or publish credentials, access tokens, passwords, private keys, certificates, personal data, private server addresses, hosting account identifiers or infrastructure configuration containing authentication data.

The browser application uses only public PokéAPI endpoints. It does not require an application secret, API token, database password or server-side runtime configuration.

## STRATO deployment credentials

Production deployment uses SFTP credentials stored only in the GitHub Actions environment named `production`.

The following values must exist only as protected GitHub environment secrets:

- `STRATO_SFTP_HOST`
- `STRATO_SFTP_PORT`
- `STRATO_SFTP_USER`
- `STRATO_SFTP_PASSWORD`
- `STRATO_SFTP_REMOTE_PATH`
- `STRATO_SFTP_KNOWN_HOSTS`

Do not copy the values into workflow files, documentation, issues, pull-request comments, commit messages, screenshots or logs.

The deployment password is provided to `lftp` through the `LFTP_PASSWORD` environment variable and its `--env-password` option. It must not be included in a command-line URL, generated configuration file or repository file.

The SSH host key must be stored as a complete verified `known_hosts` entry. Strict host-key checking must remain enabled. Automatic acceptance of an unknown SSH host key is not permitted.

## Deployment target safety

The STRATO directory assigned to `pokedex.byangama.de` must be dedicated exclusively to this application.

The production workflow mirrors `dist` to the configured directory and deletes obsolete remote files. For this reason:

- never configure the complete webspace root as `STRATO_SFTP_REMOTE_PATH`
- never configure a directory shared with another website
- never configure an empty path, `/`, `.`, `..` or a path containing parent traversal
- verify the STRATO subdomain-to-directory assignment before enabling deployment

The workflow validates these conditions before connecting, but the account owner remains responsible for selecting the correct dedicated directory.

## GitHub Actions permissions

Pull-request validation has read-only repository access and receives no STRATO deployment secrets.

Production deployment runs only from `master`, uses read-only repository access and obtains credentials from the protected `production` environment. Do not grant write access to repository contents unless a future workflow has a documented and reviewed requirement for it.

Third-party deployment actions are intentionally avoided. The workflow installs the distribution-provided `lftp` package and performs the SFTP synchronization directly.

## Local configuration

Local `.env` files, private keys, certificates and keystores are excluded through `.gitignore`. An `.env.example` file may be committed only when it contains documentation-safe variable names and no real or reusable values.

Before committing configuration changes, review the complete diff for credentials, account identifiers, hostnames that are intended to remain private, local paths and personal data.

## Credential exposure response

When a credential may have been committed or printed in a workflow log:

1. Revoke or rotate the affected credential immediately in STRATO or GitHub.
2. Disable the affected deployment workflow until the replacement secret is configured.
3. Remove the exposed value from the current branch and repository history where required.
4. Review GitHub Actions logs, artifacts, pull requests and forks for further exposure.
5. Verify the STRATO webspace contents and access history before restoring deployment.

Deleting only the latest file revision is not sufficient after a secret has entered Git history.

## Reporting a vulnerability

Do not publish credentials or exploitable security details in a public issue. Use GitHub private vulnerability reporting or a private security advisory for this repository.

When reporting a vulnerability, include the affected version or commit, reproduction steps, expected behavior, actual behavior and the security impact. Remove personal data and credentials from screenshots, logs and attachments.
