<script setup>
import { RouterLink } from 'vue-router'
import { asset } from '../lib/assets.js'

const projects = [
  { to: '/chronologie', title: '📜 Histoire du Royaume', desc: 'La chronologie détaillée des grandes ères et des événements majeurs.' },
  { to: '/personnage', title: '🌙 Les Divinités', desc: 'Les entités qui influencent le destin du monde et ses habitants.' },
  { to: '/carte', title: '🗺️ Cartes et Lieux', desc: 'Une exploration des terres, royaumes et mystères anciens.' },
]

const team = [
  { name: '@AncestralZ', role: "L'Architecte", img: 'AncestralZ' },
  { name: '@Aonoa', role: 'Le Conteur', img: 'Aonoa' },
  { name: '@Blacotte', role: "L'archiviste", img: 'Blacotte' },
  { name: '@Chelonia', role: "L'Aède", img: 'Chelonia' },
  { name: '@ERY', role: 'Le Naturaliste', img: 'ERY' },
  { name: '@Pycsou', role: "L'Explorateur", img: 'Pycsou' },
  { name: '@Zango', role: 'Le Cartographe', img: 'Zango' },
]
</script>

<template>
  <div class="team-lore">
    <section class="intro">
      <h1>Team Lore</h1>
      <p>
        Nous sommes les gardiens du récit et de l'univers de SPAM. Notre mission :
        tisser les histoires, légendes et chronologies qui donnent vie à ce monde.
        De la mythologie fondatrice aux intrigues les plus sombres, nous sculptons
        le cœur narratif du projet.
      </p>
    </section>

    <section class="projects">
      <h2>Nos Travaux</h2>
      <div class="project-grid">
        <RouterLink v-for="p in projects" :key="p.to" class="project-card" :to="p.to">
          <h3>{{ p.title }}</h3>
          <p>{{ p.desc }}</p>
        </RouterLink>
      </div>
    </section>

    <section class="team">
      <h2>Notre Équipe</h2>
      <div class="member-grid">
        <div v-for="m in team" :key="m.name" class="member-card">
          <img :src="asset(`img/avatar/${m.img}.webp`)" :alt="m.name" loading="lazy">
          <div class="member-info">
            <h3>{{ m.name }}</h3>
            <p>{{ m.role }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.team-lore {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 80px;
  padding: 100px 10%;
}
.team-lore section {
  width: 100%;
  max-width: 1200px;
  background: var(--bg-dark);
  backdrop-filter: blur(20px) saturate(160%);
  border: 1px solid var(--glass-border);
  border-radius: 20px;
  box-shadow: 0 0 24px rgba(126, 63, 242, 0.3);
  padding: 40px 60px;
  text-align: center;
}
.intro h1 { font-size: 2.8rem; text-shadow: 0 0 12px var(--accent-bright); }
.intro p { font-size: 1.1rem; color: var(--text); line-height: 1.7; }

.projects h2, .team h2 {
  font-size: 2rem;
  text-shadow: 0 0 10px var(--accent);
  margin-bottom: 40px;
}

.project-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 30px;
}
.project-card {
  display: block;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--glass-border);
  border-radius: 14px;
  padding: 25px;
  text-decoration: none;
  color: inherit;
  transition: all 0.3s ease;
}
.project-card:hover,
.project-card:active {
  transform: translateY(-5px);
  box-shadow: 0 0 18px rgba(0, 180, 255, 0.4);
  border-color: rgba(0, 180, 255, 0.5);
}
.project-card h3 { color: var(--accent); }
.project-card p { color: var(--text); }

.member-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 40px;
  justify-items: center;
}
.member-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--glass-border);
  border-radius: 18px;
  padding: 25px;
  transition: all 0.3s ease;
  width: 100%;
}
.member-card:hover { transform: translateY(-5px); box-shadow: 0 0 18px rgba(126, 63, 242, 0.4); }
.member-card img {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--accent);
}
.member-card h3 { color: var(--accent); font-size: 1.2rem; margin: 0; }
.member-card p { color: #b9dfff; font-size: 0.9rem; margin: 4px 0 0; }

@media (max-width: 900px) {
  .team-lore { gap: 36px; padding: 40px 5%; }
  .team-lore section { padding: 28px 22px; }
  .intro h1 { font-size: 2.1rem; }
  .intro p { font-size: 1rem; }
  .projects h2, .team h2 { font-size: 1.5rem; margin-bottom: 24px; }
  .project-grid { gap: 16px; }
  .project-card { padding: 18px; }
  .member-grid { gap: 18px; }
  .member-card {
    padding: 16px;
    flex-direction: row;
    text-align: left;
  }
  .member-card img { width: 64px; height: 64px; flex-shrink: 0; }
  .member-info { text-align: left; }
  .member-card h3 { font-size: 1.05rem; }
}
</style>
