import { readonly, ref } from 'vue';
import {
  getPokemonSpeciesIdentity,
  isPokemonForSpecies,
} from '../utils/pokemonForms.js';

const activePokemonForm = ref(null);
const activePokemonSpecies = ref(null);
const defaultPokemonForm = ref(null);

const identitiesMatch = (first, second) => {
  if (first?.id && second?.id) return Number(first.id) === Number(second.id);
  return Boolean(first?.name && second?.name) && first.name === second.name;
};

const clearState = () => {
  activePokemonForm.value = null;
  activePokemonSpecies.value = null;
  defaultPokemonForm.value = null;
};

export const useActivePokemonForm = () => ({
  activePokemonForm: readonly(activePokemonForm),
  activePokemonSpecies: readonly(activePokemonSpecies),
  defaultPokemonForm: readonly(defaultPokemonForm),
  initializeActivePokemonForm(details, species) {
    if (!details || !species || !isPokemonForSpecies(details, species)) {
      clearState();
      return false;
    }

    activePokemonSpecies.value = getPokemonSpeciesIdentity(species);
    activePokemonForm.value = details;
    const defaultName = species.varieties?.find((variety) => variety.is_default)?.pokemon?.name;
    defaultPokemonForm.value = details.name === defaultName ? details : null;
    return true;
  },
  setActivePokemonForm(details) {
    if (
      !details
      || !activePokemonSpecies.value
      || !isPokemonForSpecies(details, activePokemonSpecies.value)
    ) {
      return false;
    }

    activePokemonForm.value = details;
    return true;
  },
  setDefaultPokemonForm(details) {
    if (
      !details
      || !activePokemonSpecies.value
      || !isPokemonForSpecies(details, activePokemonSpecies.value)
    ) {
      return false;
    }

    defaultPokemonForm.value = details;
    return true;
  },
  resetActivePokemonForm() {
    if (!defaultPokemonForm.value) return null;
    activePokemonForm.value = defaultPokemonForm.value;
    return defaultPokemonForm.value;
  },
  clearActivePokemonForm(expectedSpecies = null) {
    if (
      expectedSpecies
      && activePokemonSpecies.value
      && !identitiesMatch(
        getPokemonSpeciesIdentity(expectedSpecies),
        activePokemonSpecies.value,
      )
    ) {
      return false;
    }

    clearState();
    return true;
  },
});
