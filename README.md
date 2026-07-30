# Pokédex Vue

A responsive Pokédex built with Vue, Vite, Tailwind CSS and the public PokéAPI.

## Features

- Loads the complete Pokémon list reported by PokéAPI
- Searches Pokémon by name or Pokédex number
- Displays normal and shiny sprites
- Shows types, measurements, abilities, descriptions and base experience
- Calculates combined weaknesses, resistances and immunities for dual-type Pokémon
- Displays complete branched evolution chains
- Lists all available moves
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

## Preview the production build

```sh
npm run preview
```

## Data source

Pokémon data is loaded from the public PokéAPI. Sprite images are loaded from the official PokeAPI sprites repository.
