<script setup>
// Exemple minimal de page portée en Vue.
// Ici tu remplaceras par le vrai contenu de race.html + la logique de race.js.
const exemples = ['Calamité', 'Arsh', 'Dhöggeïr', 'Divinité', 'Abyssal']
</script>

<template>
  <section>
    <h1>Races</h1>
    <p>Squelette de la page Races (à remplir avec le contenu de <code>race.html</code>).</p>
    <ul>
      <li v-for="r in exemples" :key="r">{{ r }}</li>
    </ul>
  </section>
</template>
