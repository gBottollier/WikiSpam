<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <header class="app-nav">
    <RouterLink to="/">Accueil</RouterLink>
    <RouterLink to="/race">Races</RouterLink>
    <!-- Lien de retour vers le site statique existant -->
    <a class="back" href="/WikiSpam/">← Site principal</a>
  </header>

  <main class="app-main">
    <RouterView />
  </main>
</template>

<style scoped>
.app-nav {
  display: flex;
  gap: 1.25rem;
  align-items: center;
  padding: 1rem 1.5rem;
  background: #0d1220;
  border-bottom: 1px solid #1e2740;
}
.app-nav a {
  color: #9fb4ff;
  text-decoration: none;
  font-weight: 600;
}
.app-nav a.router-link-active { color: #fff; }
.app-nav .back { margin-left: auto; color: #6b7aa0; }
.app-main { padding: 2rem 1.5rem; }
</style>
