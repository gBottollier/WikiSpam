import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Race from '../views/Race.vue'

// Hash history => URLs du type  …/WikiSpam/app/#/race
// Aucune config serveur nécessaire, marche partout sur GitHub Pages.
const routes = [
  { path: '/', name: 'home', component: Home },
  { path: '/race', name: 'race', component: Race },
  // Ajoute ici les autres pages au fur et à mesure du portage :
  // { path: '/carte', component: () => import('../views/Carte.vue') },
  // { path: '/chronologie', component: () => import('../views/Chronologie.vue') },
]

export default createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})
