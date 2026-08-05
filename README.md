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

## Deployment

The repository contains a GitHub Pages workflow at `.github/workflows/deploy-pages.yml`.

- Pull requests targeting `master` run the production build without deploying.
- Pushes to `master` build the application and publish only the generated `dist` directory.
- The workflow uses the minimum required GitHub permissions.
- No application secret, PokéAPI token, VPS password, SSH key or SFTP credential is required.

### One-time GitHub Pages configuration

After the deployment workflow has been merged into `master`:

1. Open the repository settings on GitHub.
2. Open **Pages** under **Code and automation**.
3. Set **Build and deployment → Source** to **GitHub Actions**.
4. Add `pokedex.byangama.de` as the custom domain.
5. Enable **Enforce HTTPS** as soon as GitHub makes the option available.
6. Restrict the `github-pages` environment to deployments from `master` when deployment protection rules are available for the repository plan.

The custom domain must be configured in the GitHub repository settings. A `CNAME` file in the repository is not required when a custom GitHub Actions workflow publishes the site.

### DNS configuration

Configure the existing `pokedex` subdomain at the DNS provider as a CNAME record pointing to:

```text
angama666.github.io
```

Add the custom domain in GitHub before changing the DNS record. This prevents the subdomain from temporarily pointing to an unclaimed GitHub Pages site.

DNS-provider credentials, account numbers and private infrastructure details must never be committed to this public repository.

## Security

Read [SECURITY.md](SECURITY.md) before adding configuration or changing the deployment target. Local environment files, private keys, certificates and keystores are intentionally excluded through `.gitignore`.

## Data source

Pokémon data is loaded from the public PokéAPI. Sprite images are loaded from the official PokéAPI sprites repository.
