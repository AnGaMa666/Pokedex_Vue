import { readonly, ref } from 'vue';

const activePokemonForm = ref(null);

export const useActivePokemonForm = () => ({
  activePokemonForm: readonly(activePokemonForm),
  setActivePokemonForm(details) {
    activePokemonForm.value = details || null;
  },
  clearActivePokemonForm() {
    activePokemonForm.value = null;
  },
});
