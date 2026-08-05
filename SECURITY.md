# Security Policy

## Public repository

This repository is public. Never commit or publish credentials, access tokens, passwords, private keys, certificates, personal data, server addresses that are not intended to be public, or infrastructure configuration containing authentication data.

The application is designed to use only public PokéAPI endpoints from the browser. It does not require an application secret, API token, database password, SSH key or deployment password.

## Deployment credentials

The GitHub Pages deployment uses GitHub's short-lived OpenID Connect token and the repository's built-in Pages permissions. No VPS, SFTP, SSH or DNS-provider credentials belong in this repository.

If the deployment target changes in the future, store sensitive values only in GitHub Environments or GitHub Actions secrets. Reference them from workflows through the `secrets` context and never print them to workflow logs.

## Local configuration

Local `.env` files, private keys, certificates and keystores are excluded through `.gitignore`. An `.env.example` file may be committed only when it contains documentation-safe names and non-sensitive example values.

## Reporting a vulnerability

Do not publish credentials or exploitable security details in a public issue. Use GitHub's private vulnerability reporting or a private security advisory for this repository.

When reporting a vulnerability, include the affected version or commit, reproduction steps, expected behavior, actual behavior and the security impact. Remove personal data and credentials from screenshots, logs and attachments.
