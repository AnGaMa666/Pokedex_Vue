<template>
  <TypeColor :types="pokemonDetails?.types || []">
    <div class="pokemon-details" v-if="pokemonDetails">
      <h1 class="text-3xl font-bold capitalize">
        {{ pokemonDetails.name }}
        <img
            :src="isShiny ? pokemonDetails.sprites.front_shiny : pokemonDetails.sprites.front_default"
            :alt="pokemonDetails.name"
            class="imgh"
        />
      </h1>

      <p v-if="species?.flavor_text_entries.length">
        {{ getFlavorText(species.flavor_text_entries, 'de') }}<br />
        {{ getFlavorText(species.flavor_text_entries, 'en') }}
      </p>

      <div class="mt-4">
        <div><strong>Pokédex Number:</strong> {{ pokemonDetails.id }}</div>
        <div><strong>Height:</strong> {{ pokemonDetails.height / 10 }} m</div>
        <div><strong>Weight:</strong> {{ pokemonDetails.weight / 10 }} kg</div>
        <div><strong>Type:</strong> {{ getTypes(pokemonDetails.types) }}</div>
        <div><strong>No Damage From:</strong> {{ immunityForm.join(', ') }}</div>
        <div><strong>Double Damage from:</strong> {{ weaknesses2.join(', ') }}</div>
        <div><strong>Effective against:</strong> {{ strong2.join(', ') }}</div>
        <div><strong>Abilities:</strong> {{ getAbilities(pokemonDetails.abilities) }}</div>
        <div><strong>Base Experience:</strong> {{ pokemonDetails.base_experience }}</div>

        <div>
          <div><strong>Evolution Chain:</strong></div>
          <table class="evolution-chain">
            <tr>
              <td
                  v-for="evolution in evolutionChain"
                  :key="evolution.name"
              >
                <div class="evolution-item">
                  <img
                      v-if="evolution"
                      :src="isShiny ? evolution.shinySprite : evolution.defaultSprite"
                      :alt="evolution.name"
                  />
                  <span>{{ evolution.name }}</span>
                </div>
              </td>
            </tr>
          </table>
        </div>
      </div>
    </div>
  </TypeColor>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import PokeAPI from '@/services/pokeapi';
import TypeColor from './TypeColor.vue';
import { preloadSprites } from '@/utils/preloadSprite.js';

const props = defineProps({
  pokemon: Object,
  isShiny: Boolean,
});

const pokemonDetails = ref(null);
const species = ref(null);
const evolutionChain = ref([]);
const immunityForm = ref([]);
const weaknesses2 = ref([]);
const strong2 = ref([]);

const fetchPokemonDetails = async (name) => {
  if (!name) return;
  try {
    const response = await PokeAPI.getPokemonDetails(name);
    const speciesResponse = await PokeAPI.getPokemonSpecies(name);
    const evolutionResponse = await PokeAPI.getEvolutionChain(speciesResponse.data.evolution_chain.url);

    const base = response.data;
    const evoChain = await extractEvolutionChain(evolutionResponse.data.chain);

    const spriteUrls = [
      base.sprites.front_default,
      base.sprites.front_shiny,
      ...evoChain.map(e => e.defaultSprite),
      ...evoChain.map(e => e.shinySprite),
    ];
    await preloadSprites(spriteUrls);

    pokemonDetails.value = base;
    species.value = speciesResponse.data;
    evolutionChain.value = evoChain;

    immunityForm.value = await PokeAPI.getPokemonImmunityForm(base.types);
    weaknesses2.value = await PokeAPI.getPokemonWeaknesses2(base.types);
    strong2.value = await PokeAPI.getPokemonEffectiv2(base.types);
  } catch (error) {
    console.error('Fehler bei Pokémon-Details:', error);
  }
};

const extractEvolutionChain = async (chain) => {
  const chainArray = [];
  let current = chain;
  while (current && current.species) {
    try {
      const response = await PokeAPI.getPokemonDetails(current.species.name);
      const data = response.data;
      chainArray.push({
        name: current.species.name,
        defaultSprite: data.sprites.front_default,
        shinySprite: data.sprites.front_shiny,
      });
    } catch (error) {
      chainArray.push({ name: current.species.name, defaultSprite: '', shinySprite: '' });
    }
    current = current.evolves_to.length ? current.evolves_to[0] : null;
  }
  return chainArray;
};

const getFlavorText = (entries, lang) => {
  const entry = entries.find((entry) => entry.language.name === lang);
  return entry ? entry.flavor_text : 'No description available.';
};

const getTypes = (types) => types.map((type) => type.type.name).join(', ');
const getAbilities = (abilities) => abilities.map((a) => a.ability.name).join(', ');

watch(() => props.pokemon, (newPokemon) => {
  if (newPokemon) {
    fetchPokemonDetails(newPokemon.name);
  }
});
onMounted(() => {
  if (props.pokemon) {
    fetchPokemonDetails(props.pokemon.name);
  }
});
</script>
