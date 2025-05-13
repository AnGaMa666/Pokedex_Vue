<template>
  <div class="pokemon-details" v-if="currentForm" :style="getBackground(currentForm.types)">
    <h1 class="text-3xl font-bold capitalize text-center, Details-Pokemon">
      {{ currentForm.name }}
      <img
          :src="isShiny ? currentForm.sprites.front_shiny : currentForm.sprites.front_default"
          :alt="currentForm.name"
          class="imgh"
      />
    </h1>

    <div class="form-tabs" v-if="forms.length > 1">
      <div
          v-for="form in forms.filter(f => f && f.name)"
          :key="form.name"
          :class="['form-tab', { active: form.name === currentForm?.name }]"
          @click="setForm(form)"
      >
        <img
            :src="isShiny ? form.sprites.front_shiny : form.sprites.front_default"
            :alt="form.name"
        />
        <div>{{ form.name }}</div>
        <div v-if="form.condition" class="form-condition">{{ form.condition }}</div>
      </div>
    </div>

    <p v-if="species?.flavor_text_entries?.length">
      {{ getFlavorText(species.flavor_text_entries, 'de') }}<br/>
      {{ getFlavorText(species.flavor_text_entries, 'en') }}
    </p>

    <div class="mt-4">
      <div><strong>Pokédex Number:</strong> {{ currentForm.id }}</div>
      <div><strong>Height:</strong> {{ currentForm.height / 10 }} m</div>
      <div><strong>Weight:</strong> {{ currentForm.weight / 10 }} kg</div>
      <div><strong>Type:</strong> {{ getTypes(currentForm.types) }}</div>
      <div><strong>Abilities:</strong> {{ getAbilities(currentForm.abilities) }}</div>
      <div><strong>Base Experience:</strong> {{ currentForm.base_experience }}</div>
    </div>

    <div class="mt-4">
      <div class="Evo">
      <strong>Evolution Chain:</strong>
      </div>
      <div class="evolution-chain-vertical">
        <template v-for="(chain, idx) in evolutionChains" :key="idx">
          <div class="evolution-path">
            <div class="evolution-item">
              <img :src="isShiny ? chain.from.shinySprite : chain.from.defaultSprite" :alt="chain.from.name"/>
              <span>{{ chain.from.name }}</span>
            </div>

            <div class="evolution-arrow">
              <div class="evo-method">
                {{ chain.method.description }}
                <template v-if="chain.method.time === 'day'">🌞</template>
                <template v-else-if="chain.method.time === 'night'">🌙</template>
                <template v-if="chain.method.affection">❤️</template>
              </div>
              <div class="arrow">→</div>
              <div v-if="chain.method.item" class="evo-item">
                <img :src="chain.method.item.sprite" :alt="chain.method.item.name" class="evo-icon"/>
                <div class="evo-item-name">{{ chain.method.item.name }}</div>
              </div>
            </div>

            <div class="evolution-item">
              <img :src="isShiny ? chain.to.shinySprite : chain.to.defaultSprite" :alt="chain.to.name"/>
              <span>{{ chain.to.name }}</span>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import {ref, watch, onMounted} from 'vue';
import PokeAPI from '@/services/pokeapi';
import {preloadSprites} from '@/utils/preloadSprite.js';
import {setCachedDetails} from '@/utils/cache.js';
import {TypeColors} from '@/utils/colors.js';

const props = defineProps({pokemon: Object, isShiny: Boolean});

const species = ref(null);
const forms = ref([]);
const currentForm = ref(null);
const evolutionChains = ref([]);

const setForm = (form) => {
  if (form && form.name) currentForm.value = form;
};

const getBackground = (types) => {
  if (!types?.length) return {};
  const color1 = TypeColors[types[0]?.type?.name] || '#FFF';
  if (types.length === 1) return {backgroundColor: color1};
  const color2 = TypeColors[types[1]?.type?.name] || '#FFF';
  return {background: `linear-gradient(to right, ${color1}, ${color2})`};
};

const fetchForms = async (name) => {
  try {
    const res = await PokeAPI.getPokemonDetails(name);
    const speciesRes = await PokeAPI.getPokemonSpecies(name.split('-')[0]);
    species.value = speciesRes.data;

    const baseForm = res.data;
    const formList = [baseForm];

    for (const v of speciesRes.data.varieties || []) {
      if (v.pokemon.name !== name) {
        const formRes = await PokeAPI.getPokemonDetails(v.pokemon.name);
        const formData = formRes.data;
        formData.condition = v.pokemon.name.includes('-mega') ? 'Mega-Entwicklung'
            : v.pokemon.name.includes('-gmax') ? 'Gigadynamax'
                : v.pokemon.name.includes('-hisui') ? 'Hisui-Form'
                    : v.pokemon.name.includes('-alola') ? 'Alola-Form'
                        : v.pokemon.name.includes('-galar') ? 'Galar-Form'
                            : v.pokemon.name.includes('-origin') ? 'Origin-Form'
                                : 'Besondere Form';
        formList.push(formData);
      }
    }

    const allSprites = formList.flatMap(f => [f.sprites.front_default, f.sprites.front_shiny]).filter(Boolean);
    await preloadSprites(allSprites);

    forms.value = formList;
    currentForm.value = formList[0];

    const evo = await PokeAPI.getEvolutionChain(species.value.evolution_chain.url);
    evolutionChains.value = await extractEvolutionPaths(evo.data.chain);

    if (formList[0]?.id) {
      setCachedDetails('details-' + name, {
        forms: formList,
        species: species.value,
        evolutionChain: evolutionChains.value
      });
    }
  } catch (error) {
    console.error('[Details] Fehler beim Laden:', error);
  }
};

const extractEvolutionPaths = async (chain) => {
  const paths = [];
  const fromName = chain.species?.name;
  if (!fromName) return [];

  let fromPokemon = {};
  try {
    const res = await PokeAPI.getPokemonDetails(fromName);
    fromPokemon = {
      name: fromName,
      defaultSprite: res.data.sprites.front_default,
      shinySprite: res.data.sprites.front_shiny
    };
  } catch {
    fromPokemon = {name: fromName, defaultSprite: '', shinySprite: ''};
  }

  for (const next of chain.evolves_to || []) {
    const toName = next.species?.name;
    if (!toName) continue;

    let toPokemon = {};
    try {
      const res = await PokeAPI.getPokemonDetails(toName);
      toPokemon = {
        name: toName,
        defaultSprite: res.data.sprites.front_default,
        shinySprite: res.data.sprites.front_shiny
      };
    } catch {
      toPokemon = {name: toName, defaultSprite: '', shinySprite: ''};
    }

    const detail = next.evolution_details?.[0] || {};
    const trigger = detail.trigger?.name || '';
    const itemName = detail.item?.name || detail.held_item?.name || null;
    const itemSprite = itemName
        ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${itemName}.png`
        : null;

    const descParts = [];
    if (trigger === 'level-up') {
      descParts.push(detail.min_level ? `Level ${detail.min_level}` : 'Level-Up');
      if (itemName) descParts.push(`mit ${itemName}`);
      if (detail.min_affection) descParts.push(`mit hoher Zuneigung`);
      if (detail.time_of_day) descParts.push(`bei ${detail.time_of_day}`);
    } else if (trigger === 'use-item' && itemName) {
      descParts.push(`${itemName} einsetzen`);
    } else {
      descParts.push(trigger);
    }

    const method = {
      description: descParts.join(', '),
      time: detail.time_of_day,
      affection: detail.min_affection,
      item: itemName ? {name: itemName, sprite: itemSprite} : null
    };

    paths.push({from: fromPokemon, to: toPokemon, method});
    const deeper = await extractEvolutionPaths(next);
    paths.push(...deeper);
  }

  return paths;
};

const getFlavorText = (entries, lang) => {
  const entry = entries.find(e => e.language.name === lang);
  return entry ? entry.flavor_text.replace(/\f/g, ' ') : 'Keine Beschreibung verfügbar.';
};

const getTypes = (types) => types.map(t => t.type.name).join(', ');
const getAbilities = (abilities) => abilities.map(a => a.ability.name).join(', ');

watch(() => props.pokemon, (newVal) => {
  if (newVal?.name) fetchForms(newVal.name);
});
onMounted(() => {
  if (props.pokemon?.name) fetchForms(props.pokemon.name);
});
</script>

<style scoped>
.pokemon-details {
  max-width: 750px;
  padding: 20px;
  margin: 20px auto;
  border: 1px solid #ccc;
  box-sizing: border-box;
  overflow: auto;
  max-height: calc(100vh - 100px);
}
.Evo {
  text-align: center;
  text-transform: capitalize;
  font-size: 1.2rem;
  margin-top: 20px;
}
.Details-Pokemon {
  text-align: center;
  margin-bottom: 20px;
  text-transform: capitalize;
}

.imgh {
  width: 120px;
  height: 120px;
  margin: 0 auto;
  display: block;
}

.form-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 16px 0;
  justify-content: center;
}

.form-tab {
  cursor: pointer;
  text-align: center;
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 6px;
  width: 90px;
  transition: background 0.2s ease;
}

.form-tab.active {
  background-color: #e0e0e0;
  border-color: #888;
  text-transform: capitalize;
}

.form-tab img {
  width: 50px;
  height: 50px;
  margin-bottom: 4px;
}

.form-condition {
  font-size: 0.7rem;
  margin-top: 2px;
  color: #666;
}

.evolution-chain-vertical {
  display: flex;
  flex-direction: column;
  gap: 32px;
  align-items: center;
  margin-top: 20px;
  max-height: 50vh;
  overflow-y: auto;
}

.evolution-path {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
}

.evolution-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-transform: capitalize;
}

.evolution-arrow {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.arrow {
  font-size: 24px;
  font-weight: bold;
  margin: 4px 0;
}

.evo-method {
  font-size: 14px;
  text-align: center;
}

.evo-icon {
  width: 32px;
  height: 32px;
  margin-bottom: 4px;
}

.evo-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 4px;
}

.evo-item-name {
  font-size: 0.8rem;
  margin-top: 2px;
  text-align: center;
  text-transform: capitalize;
  max-width: 80px;
}
</style>
