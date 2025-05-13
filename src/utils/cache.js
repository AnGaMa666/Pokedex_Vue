const STORAGE_KEY_PREFIX = 'details-';

export function getCachedData(key) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        console.warn(`Fehler beim Lesen von ${key}:`, e);
        return null;
    }
}

/**
 * Nur für einzelne Pokémon-Detailseiten
 */
export function setCachedDetails(key, data) {
    try {
        const compactData = {
            pokemonDetails: {
                id: data.pokemonDetails.id,
                name: data.pokemonDetails.name,
                sprites: data.pokemonDetails.sprites,
                types: data.pokemonDetails.types,
                abilities: data.pokemonDetails.abilities,
                base_experience: data.pokemonDetails.base_experience,
                height: data.pokemonDetails.height,
                weight: data.pokemonDetails.weight,
            },
            species: {
                flavor_text_entries: data.species?.flavor_text_entries || [],
                evolution_chain: data.species?.evolution_chain || {},
            },
            evolutionChain: data.evolutionChain,
            immunityForm: data.immunityForm,
            weaknesses2: data.weaknesses2,
            strong2: data.strong2,
        };

        localStorage.setItem(key, JSON.stringify(compactData));
    } catch (e) {
        console.warn(`Fehler beim Speichern von ${key}:`, e);
    }
}

/**
 * Generisch für große Listen (Pokedex, Moves, Items, Berries)
 */
export function setCachedList(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.warn(`Fehler beim Speichern von ${key}:`, e);
    }
}

/**
 * Lösche alle Detaildaten
 */
export function clearAllPokemonCache() {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(STORAGE_KEY_PREFIX));
    keys.forEach(key => localStorage.removeItem(key));
}
