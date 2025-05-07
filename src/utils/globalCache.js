export const globalCache = {
    get(key) {
        const json = sessionStorage.getItem(key);
        return json ? JSON.parse(json) : null;
    },
    set(key, value) {
        sessionStorage.setItem(key, JSON.stringify(value));
    },
    clear(key) {
        sessionStorage.removeItem(key);
    },
    keys: {
        pokedex: 'cache_pokedex',
        moves: 'cache_moves',
        berries: 'cache_berries',
        pokemonDetails: (name) => `cache_pokemon_${name}`,
    },
};
