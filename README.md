# Pokédex Vue

A responsive Pokédex built with Vue, Vite, Tailwind CSS and the public PokéAPI.

## Features

- Loads the complete Pokémon list reported by PokéAPI
- Searches Pokémon by name or Pokédex number
- Displays normal and shiny sprites
- Shows types, measurements, abilities, descriptions and base experience
- Calculates combined weaknesses, resistances and immunities for dual-type Pokémon
- Displays complete branched evolution chains
- Provides searchable move, item and berry sections with detail views
- Excludes berries and machine items from the regular item directory
- Uses accessible buttons, labels, loading states and error messages
- Provides responsive desktop, tablet and mobile layouts

## Requirements

- Node.js 20.19 or newer, or Node.js 22.12 or newer
- npm

## Installation

```sh
npm install
```

## Development

```sh
npm run dev
```

The Vite development server is only intended for local development. Do not expose it to an untrusted network.

## Production build

```sh
npm run build
```

The generated static website is written to `dist`.

## Preview the production build

```sh
npm run preview
```

## Deployment target

The production website is intended to run from the STRATO-hosted subdomain:

```text
https://pokedex.byangama.de
```

The subdomain must point to a dedicated directory in the STRATO webspace. The repository does not contain the STRATO account, SFTP server, username, password, target directory or SSH host key.

## GitHub Actions

Two workflows are used:

- `.github/workflows/deploy-pages.yml` performs the production build for pull requests targeting `master`. Despite the historical file name, it does not configure or deploy GitHub Pages.
- `.github/workflows/deploy-strato.yml` builds and deploys the application after a push or merge to `master`. It can also be started manually from `master`.

The deployment workflow:

- installs the exact dependency versions from `package-lock.json` with `npm ci`
- creates a fresh Vite production build
- verifies that `dist/index.html` and `dist/assets` exist
- verifies the STRATO SFTP configuration before connecting
- checks the STRATO SSH host key through a preconfigured `known_hosts` entry
- synchronizes only the generated `dist` directory to the dedicated subdomain directory
- removes obsolete files from that dedicated target directory
- stores no deployment artifact after the job
- does not use GitHub Pages

## One-time STRATO configuration

Configure `pokedex.byangama.de` in the STRATO customer area so that the subdomain uses its own dedicated web directory. Do not use the root of the complete webspace as the Pokédex target.

The value configured as `STRATO_SFTP_REMOTE_PATH` must be exactly the directory assigned to `pokedex.byangama.de`. The deployment uses a mirrored synchronization with deletion of obsolete files. Everything inside that target directory is therefore treated as part of the Pokédex deployment.

HTTPS must be enabled for `pokedex.byangama.de` in STRATO. The final public address is:

```text
https://pokedex.byangama.de
```

## GitHub production environment

Create a GitHub Actions environment named `production` under:

```text
Repository settings → Environments → New environment → production
```

Store the following values as environment secrets. Never commit their values to the repository.

| Secret | Required content |
| --- | --- |
| `STRATO_SFTP_HOST` | STRATO SFTP/SSH server hostname belonging to the webspace |
| `STRATO_SFTP_PORT` | Numeric SFTP/SSH port configured for the STRATO connection |
| `STRATO_SFTP_USER` | STRATO SFTP username |
| `STRATO_SFTP_PASSWORD` | STRATO SFTP password |
| `STRATO_SFTP_REMOTE_PATH` | Dedicated webspace directory assigned to `pokedex.byangama.de` |
| `STRATO_SFTP_KNOWN_HOSTS` | Complete verified SSH `known_hosts` entry for the configured STRATO hostname and port |

The workflow refuses to deploy when one of these secrets is missing. It also rejects an empty target, `/`, `.`, `..` and paths containing parent traversal.

The SSH host key must be verified against trusted STRATO account information before it is stored. Do not accept an unknown key automatically and do not replace the secret solely because an unverified connection reports a different key.

## Deployment behavior

Pull requests never receive STRATO credentials and never deploy. After a successful merge to `master`, the production workflow builds the current commit and synchronizes the result to the configured STRATO directory.

The `production` environment may additionally use deployment protection rules so that only `master` is allowed to deploy. A required reviewer can be enabled when manual approval before publication is desired.

## Security

Read [SECURITY.md](SECURITY.md) before adding configuration or changing the deployment target. Local environment files, private keys, certificates and keystores are intentionally excluded through `.gitignore`.

## Data source

Pokémon data is loaded from the public PokéAPI. Sprite images are loaded from the official PokéAPI sprites repository.
