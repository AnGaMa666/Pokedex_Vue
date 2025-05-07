import { createRouter, createWebHistory } from 'vue-router';
import Home from '@/viewPages/Home_ViewPage.vue';
import Pokedex from '@/viewPages/Pokedex_ViewPage.vue';
import Moves from '@/viewPages/Moves_ViewPage.vue';
import Items from '@/viewPages/Items_ViewPage.vue';
import Berries from '@/viewPages/Berries_ViewPage.vue';

const routes = [
    { path: '/', component: Home },
    { path: '/pokedex', component: Pokedex },
    { path: '/moves', component: Moves },
    { path: '/items', component: Items },
    { path: '/berries', component: Berries },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;
