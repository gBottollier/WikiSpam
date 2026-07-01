import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '../views/Home.vue'

// Hash history => URLs du type …/WikiSpam/app/#/race
// Aucune config serveur nécessaire, marche partout sur GitHub Pages.
const routes = [
  { path: '/', name: 'home', component: Home, meta: { title: 'SPAM Lore' } },
  { path: '/race', name: 'race', component: () => import('../views/Race.vue'), meta: { title: 'Races' } },
  { path: '/carte', name: 'carte', component: () => import('../views/Carte.vue'), meta: { title: 'Carte' } },
  { path: '/chronologie', name: 'chronologie', component: () => import('../views/Chronologie.vue'), meta: { title: 'Chronologie' } },
  { path: '/personnage', name: 'personnage', component: () => import('../views/Personnage.vue'), meta: { title: 'Personnages' } },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

router.afterEach((to) => {
  document.title = to.meta?.title ? `${to.meta.title} — SPAM Lore` : 'SPAM Lore'
})

export default router
