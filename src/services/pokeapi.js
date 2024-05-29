import axios from 'axios';

const apiClient = axios.create({
    baseURL: 'https://pokeapi.co/api/v2',
    withCredentials: false,
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    },
});

export default {
    getPokemons(limit = 1025, offset = 0) {
        return apiClient.get(`/pokemon?limit=${limit}&offset=${offset}`);
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
    getPokemonImmunityForm(types) {
        const typePromises = types.map(type => apiClient.get(`/type/${type.type.name}`));
        return Promise.all(typePromises).then(responses => {
            const immunities = responses.flatMap(response => response.data.damage_relations.no_damage_from.map(type => type.name));
            return Array.from(new Set(immunities));
        });
    },
    getPokemonWeaknesses2(types) {
        const typePromises = types.map(type => apiClient.get(`/type/${type.type.name}`));
        return Promise.all(typePromises).then(responses => {
            const weaknesses = responses.flatMap(response => response.data.damage_relations.double_damage_from.map(type => type.name));
            return Array.from(new Set(weaknesses));
        });
    },
    getPokemonWeaknesses05(types) {
        const typePromises = types.map(type => apiClient.get(`/type/${type.type.name}`));
        return Promise.all(typePromises).then(responses => {
            const weaknesses = responses.flatMap(response => response.data.damage_relations.half_damage_from.map(type => type.name));
            return Array.from(new Set(weaknesses));
        });
    },
    getPokemonImmunityTo(types) {
        const typePromises = types.map(type => apiClient.get(`/type/${type.type.name}`));
        return Promise.all(typePromises).then(responses => {
            const immunities = responses.flatMap(response => response.data.damage_relations.no_damage_to.map(type => type.name));
            return Array.from(new Set(immunities));
        });
    },
    getPokemonEffectiv05(types) {
        const typePromises = types.map(type => apiClient.get(`/type/${type.type.name}`));
        return Promise.all(typePromises).then(responses => {
            const effects = responses.flatMap(response => response.data.damage_relations.half_damage_to.map(type => type.name));
            return Array.from(new Set(effects));
        });
    },
    getPokemonEffectiv2(types) {
        const typePromises = types.map(type => apiClient.get(`/type/${type.type.name}`));
        return Promise.all(typePromises).then(responses => {
            const effects = responses.flatMap(response => response.data.damage_relations.double_damage_to.map(type => type.name));
            return Array.from(new Set(effects));
        });
    },
    getPokemonAbilities(abilities) {
        const abilityPromises = abilities.map(ability => apiClient.get(ability.ability.url));
        return Promise.all(abilityPromises).then(responses => responses.map(response => response.data));
    },
    getLanguageData(url) {
        return apiClient.get(url);
    },
    getPokemonDetailsByUrl(url) {
        return apiClient.get(url);
    },
    getMoveDetails(url) {
        return apiClient.get(url);
    },
    getMoves() {
        return apiClient.get('/move?limit=1000');
    },
    getItems(limit = 1000) {
        return apiClient.get(`/item?limit=${limit}`);
    },
    getBerries(limit = 1000) {
        return apiClient.get(`/berry?limit=${limit}`);
    },
};