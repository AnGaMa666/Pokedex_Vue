import axios from 'axios';
import { preloadSpritesInBatches } from '@/utils/preloadSprite.js';

const apiClient = axios.create({
    baseURL: 'https://pokeapi.co/api/v2',
    withCredentials: false,
    headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
    },
});

export default {
    async getPokemons(limit = 1025, offset = 0) {
        const response = await apiClient.get(`/pokemon?limit=${limit}&offset=${offset}`);
        const results = response.data.results;

        const pokemons = results.map((pokemon, index) => ({
            ...pokemon,
            id: index + 1,
            defaultImage: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${index + 1}.png`,
            shinyImage: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${index + 1}.png`,
        }));

        const spriteUrls = pokemons.flatMap(p => [p.defaultImage, p.shinyImage]).filter(Boolean);
        await preloadSpritesInBatches(spriteUrls, 25, 100);

        return { data: pokemons };
    },

    getPokemonDetails(name) {
        return apiClient.get(`/pokemon/${name}`);
    },

    getPokemonSpecies(name) {
        return apiClient.get(`/pokemon-species/${name}`);
    },

    getEvolutionChain(url) {
        return apiClient.get(url);
    },

    async getMoveDetailsByUrl(url) {
        return apiClient.get(url);
    },

    async getMoves() {
        const response = await apiClient.get('/move?limit=5000');
        const moves = response.data.results;

        const detailedMoves = await Promise.all(
            moves.map(async move => {
                try {
                    const moveDetails = await apiClient.get(`/move/${move.name}`);
                    return {
                        name: move.name,
                        type: moveDetails.data.type.name,
                        generation: moveDetails.data.generation?.name || 'unknown'
                    };
                } catch (error) {
                    console.warn(`[PokeAPI] Fehler bei Move "${move.name}":`, error.message);
                    return {
                        name: move.name,
                        type: 'unknown',
                        generation: 'unknown'
                    };
                }
            })
        );

        return { data: detailedMoves };
    },

    async getItems(limit = 1000) {
        const response = await apiClient.get(`/item?limit=${limit}`);
        const items = response.data.results;

        const filtered = items.filter(item => !item.name.includes('berry'));
        const detailedItems = [];

        const batchSize = 25;
        for (let i = 0; i < filtered.length; i += batchSize) {
            const batch = filtered.slice(i, i + batchSize);

            const batchResults = await Promise.all(
                batch.map(item =>
                    apiClient.get(item.url)
                        .then(res => ({
                            name: item.name,
                            image: res.data.sprites?.default || '',
                        }))
                        .catch(() => ({
                            name: item.name,
                            image: '',
                        }))
                )
            );

            detailedItems.push(...batchResults);

            const imageUrls = batchResults.map(item => item.image).filter(Boolean);
            await preloadSpritesInBatches(imageUrls, 10, 50);
        }

        return { data: detailedItems };
    },

    async getBerries(limit = 100) {
        const response = await apiClient.get(`/berry?limit=${limit}`);
        const berries = response.data.results;

        const detailedBerries = [];

        const batchSize = 20;
        for (let i = 0; i < berries.length; i += batchSize) {
            const batch = berries.slice(i, i + batchSize);

            const batchResults = await Promise.all(
                batch.map(async berry => {
                    try {
                        const berryData = await apiClient.get(berry.url);
                        const itemData = await apiClient.get(berryData.data.item.url);
                        return {
                            name: berry.name,
                            image: itemData.data.sprites?.default || '',
                        };
                    } catch {
                        return {
                            name: berry.name,
                            image: '',
                        };
                    }
                })
            );

            detailedBerries.push(...batchResults);

            const spriteUrls = batchResults.map(b => b.image).filter(Boolean);
            await preloadSpritesInBatches(spriteUrls, 10, 50);
        }

        return { data: detailedBerries };
    }
};
