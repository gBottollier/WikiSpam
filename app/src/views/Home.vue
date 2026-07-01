<script setup>
// Page d'accueil de l'app Vue (sous /app/).
</script>

<template>
  <section>
    <h1>WikiSpam — version Vue</h1>
    <p>
      Environnement Vue 3 + Vite + Vue Router opérationnel, servi sous
      <code>/WikiSpam/app/</code>. Le site statique existant reste intact à la racine.
    </p>
    <p>
      Prochaine étape : porter les pages une par une (Races, Carte, Chronologie…)
      en composants Vue dans <code>src/views/</code> et les ajouter au routeur.
    </p>
    <p>
      <RouterLink to="/race">→ Voir la page Races (exemple portée)</RouterLink>
    </p>
  </section>
</template>
