<script setup>
import { RouterView } from 'vue-router'
import Navbar from './components/Navbar.vue'
import BackgroundStars from './components/BackgroundStars.vue'
</script>

<template>
  <BackgroundStars />
  <Navbar />
  <main class="app-main">
    <RouterView v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </RouterView>
  </main>
</template>

<style>
.app-main { position: relative; z-index: 1; }

.fade-enter-active,
.fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from,
.fade-leave-to { opacity: 0; }
</style>
