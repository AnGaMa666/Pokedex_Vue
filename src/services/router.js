import { createRouter, createWebHistory } from 'vue-router';
import Pokedex from '@/components/Pokedex.vue';
import PokemonDetails from '@/components/PokemonDetails.vue';
import Moves from '@/components/Moves.vue';
import Items from '@/components/Items.vue';
import Berries from '@/components/Berries.vue';
import App from '@/App.vue';
import Home from '@/viewPages/Home_ViewPage.vue';
import BerriesHome from '@/viewPages/Berries_ViewPage.vue';
import ItemsHome from '@/viewPages/Items_ViewPage.vue';
import MovesHome from '@/viewPages/Moves_ViewPage.vue';
import PokedexHome from '@/viewPages/Pokedex_ViewPage.vue';


const routes = [
    { path: '/app', component: App},
    { path: '/pokedex', component: Pokedex },
    { path: '/pokemonDetails', component: PokemonDetails },
    { path: '/moves', component: Moves },
    { path: '/items', component: Items },
    { path: '/berries', component: Berries },
    { path: '/', component: Home },
    { path: '/berriesHome', component: BerriesHome },
    { path: '/itemsHome', component: ItemsHome },
    { path: '/movesHome', component: MovesHome },
    { path: '/pokedexHome', component: PokedexHome },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;
