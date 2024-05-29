<template>
  <TypeColor :types="pokemonDetails?.types || []"> <!-- Ensure types is never undefined -->
    <div class="pokemon-details" v-if="pokemonDetails">
      <h1 class="text-3xl font-bold capitalize">{{ pokemonDetails.name }}
      <img
          :src="isShiny ? pokemonDetails.sprites.front_shiny : pokemonDetails.sprites.front_default"
          :alt="pokemonDetails.name"
          class="imgh"
      />
      </h1>
      <p v-if="species?.flavor_text_entries.length">
        {{ getFlavorText(species.flavor_text_entries, 'de') }}<br>
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
          <div><strong>Evolution Chain:</strong>
            <table class="evolution-chain">
              <tr>
                <td v-for="evolution in evolutionChain" :key="evolution.name">
                  <div class="evolution-item">
                    <!-- Between pokemon evolution method, level, or item  -->
                    <img v-if="evolution.sprite" :src="evolution.sprite" :alt="evolution.name" />
                    <span>{{ evolution.name }}</span>
                  </div>
                </td>
              </tr>
            </table>
          </div>
        </div>
      </div>
    </div>
  </TypeColor>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import PokeAPI from '@/services/pokeapi';
import TypeColor from './TypeColor.vue';

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
    pokemonDetails.value = response.data;
    immunityForm.value = await PokeAPI.getPokemonImmunityForm(response.data.types);
    weaknesses2.value = await PokeAPI.getPokemonWeaknesses2(response.data.types);
    strong2.value = await PokeAPI.getPokemonEffectiv2(response.data.types);
    const speciesResponse = await PokeAPI.getPokemonSpecies(name);
    species.value = speciesResponse.data;
    const evolutionResponse = await PokeAPI.getEvolutionChain(species.value.evolution_chain.url);
    evolutionChain.value = await extractEvolutionChain(evolutionResponse.data.chain);
  } catch (error) {
    console.error('Error fetching Pokémon details:', error);
  }
};

const extractEvolutionChain = async (chain) => {
  const chainArray = [];
  let current = chain;
  while (current && current.species) {
    try {
      const response = await PokeAPI.getPokemonDetails(current.species.name);
      const sprite = response.data.sprites.front_default;
      chainArray.push({ name: current.species.name, sprite });
    } catch (error) {
      console.error('Error fetching evolution chain details:', error);
      chainArray.push({ name: current.species.name, sprite: null });
    }
    current = current.evolves_to.length ? current.evolves_to[0] : null;
  }
  return chainArray;
};

const getFlavorText = (entries, lang) => {
  const entry = entries.find(entry => entry.language.name === lang);
  return entry ? entry.flavor_text : 'No description available.';
};

const getTypes = (types) => types.map(type => type.type.name).join(', ');
const getAbilities = (abilities) => abilities.map(ability => ability.ability.name).join(', ');

watch(() => props.pokemon, (newPokemon) => {
  fetchPokemonDetails(newPokemon?.name);
});

onMounted(() => {
  if (props.pokemon) {
    fetchPokemonDetails(props.pokemon.name);
  }
});
</script>

<style scoped>
.fixed {
  position: fixed;
  top: 60px; /* Adjust top to accommodate header */
  padding: 25px;
  margin-left: 60px;
  height: calc(100vh - 60px); /* Adjust height to accommodate header */
  overflow-y: auto;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  border: 1px solid #ccc;
  background-color: #f8f8f8;
  max-width: 800px;
  max-height: 800px;
}

.evolution-chain {
  width: 100%;
  border-collapse: collapse;
}

.evolution-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.evolution-item img {
  display: block;
  margin-bottom: 5px;
}

.pokemon-details {
  max-width: 750px;
  padding: 20px;
  margin: 0 auto;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  border: 1px solid #ccc;
  background-color: #f8f8f8;
}

.text-3xl {
  font-size: 1.875rem;
  line-height: 2.25rem;
  text-align: center;
}

.imgh {
  width: 120px;
  height: 120px;

  display: block;
}
</style>
